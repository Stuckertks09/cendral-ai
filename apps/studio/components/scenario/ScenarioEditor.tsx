'use client';

import React, { useMemo } from 'react';
import { nanoid } from 'nanoid';

import type { Scenario, ScenarioStep, EventSummary } from '@/types/scenarios';

interface ScenarioEditorProps {
  value: Scenario;
  events: EventSummary[];
  mode: 'create' | 'edit';
  onChange: (next: Scenario) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({
  value,
  events,
  mode,
  onChange,
  onCancel,
  onSave,
  isSaving = false,
}) => {
  // ---------------------------------------------
  // Sort is DISPLAY-ONLY
  // ---------------------------------------------
  const sortedSteps = useMemo(() => {
    return [...(value.steps || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
  }, [value.steps]);

  // ---------------------------------------------
  // Scenario-level updates
  // ---------------------------------------------

  // ---------------------------------------------
  // Step updates (KEYED, NOT INDEXED)
  // ---------------------------------------------
  const updateStep = (key: string, patch: Partial<ScenarioStep>) => {
    const nextSteps = value.steps.map((s) =>
      s._id === key || s.clientId === key ? { ...s, ...patch } : s,
    );
    onChange({ ...value, steps: nextSteps });
  };

  const addStep = () => {
    const next = value.steps.length;
    onChange({
      ...value,
      steps: [
        ...value.steps,
        {
          clientId: nanoid(),
          label: `Step ${next + 1}`,
          order: next,
          injectAtStep: next,
          eventId: undefined,
          tags: [],
        },
      ],
    });
  };

  const removeStep = (key: string) => {
  const remaining = value.steps
    .filter((s) => s._id !== key && s.clientId !== key)
    .map((s, i) => ({
      ...s,
      order: i,
      injectAtStep: i,        // 🔥 force injectAtStep to match new order
    }));

  onChange({ ...value, steps: remaining });
};

 const moveStep = (key: string, delta: number) => {
  const idx = value.steps.findIndex(
    (s) => s._id === key || s.clientId === key,
  );
  if (idx === -1) return;

  const target = idx + delta;
  if (target < 0 || target >= value.steps.length) return;

  const next = [...value.steps];
  const [moved] = next.splice(idx, 1);
  next.splice(target, 0, moved);

  onChange({
    ...value,
    steps: next.map((s, i) => ({
      ...s,
      order: i,
      injectAtStep: i,        // 🔥 same here
    })),
  });
};

  // ---------------------------------------------
  // Render
  // ---------------------------------------------
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {mode === 'create' ? 'Create Scenario' : 'Edit Scenario'}
          </h2>
          <p className="text-[11px] text-gray-400 mt-1">
            Define multi-step sequences of events.
          </p>
        </div>

        <div className="flex gap-2 text-xs">
          <button onClick={onCancel} className="px-3 py-1 border rounded-md">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-3 py-1 bg-emerald-500 rounded-md text-black"
          >
            {isSaving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="border border-gray-800 rounded-xl bg-black/40 px-4 py-3 text-xs">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400 text-[11px]">Steps</span>
          <button onClick={addStep} className="text-[11px] border px-2 py-1">
            + Add Step
          </button>
        </div>

        {sortedSteps.length === 0 ? (
          <div className="text-gray-500 text-[11px]">No steps yet.</div>
        ) : (
          <div className="space-y-2">
            {sortedSteps.map((step) => {
              const key = step._id ?? step.clientId!;
              return (
                <div
                  key={key}
                  className="border border-gray-800 rounded-lg px-3 py-2 space-y-2"
                >
                  <div className="flex gap-2 items-center">
                    <input
                      value={step.label ?? ''}
                      onChange={(e) =>
                        updateStep(key, { label: e.target.value })
                      }
                      className="flex-1 bg-black/40 border px-2 py-1"
                    />

                    <button onClick={() => moveStep(key, -1)}>↑</button>
                    <button onClick={() => moveStep(key, 1)}>↓</button>
                    <button onClick={() => removeStep(key)}>✕</button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={step.injectAtStep ?? step.order ?? 0}
                      onChange={(e) =>
                        updateStep(key, {
                          injectAtStep: Number(e.target.value) || 0,
                        })
                      }
                      className="bg-black/40 border px-2 py-1"
                    />

                    <select
                      value={step.eventId ?? ''}
                      onChange={(e) =>
                        updateStep(key, {
                          eventId: e.target.value || undefined,
                        })
                      }
                      className="col-span-2 bg-black/40 border px-2 py-1"
                    >
                      <option value="">Select event…</option>
                      {events.map((ev) => (
                        <option key={ev._id} value={ev._id}>
                          {ev.parsed?.summary?.slice(0, 80) ||
                            ev.rawText?.slice(0, 80)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
