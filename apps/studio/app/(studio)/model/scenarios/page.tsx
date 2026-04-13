'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

import type {
  Scenario,
  ScenarioStep,
  EventSummary} from '@/types/scenarios';
import { ScenarioEditor } from '@/components/scenario/ScenarioEditor';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

type DomainFilter =
  | 'all'
  | 'defense'
  | 'political'
  | 'economic'
  | 'general';

/* ---------------------------------------------------------
   Normalization helpers
--------------------------------------------------------- */

type StepInput = Omit<ScenarioStep, 'eventId'> & {
  eventId?: string | { $oid: string };
};

type ScenarioInput = Omit<Scenario, 'steps'> & {
  steps?: ScenarioStep[];
  events?: ScenarioStep[];
};



function hasLegacyEventId(value: unknown): value is { $oid: string } {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('$oid' in value)
  ) {
    return false;
  }

  const maybeOid = (value as { $oid: unknown }).$oid;
  return typeof maybeOid === 'string';
}

function normalizeSteps(raw: readonly StepInput[] = []): ScenarioStep[] {
  return raw.map((s, i) => {
    let eventId: string | undefined;

    if (typeof s.eventId === 'string') {
      eventId = s.eventId;
    } else if (hasLegacyEventId(s.eventId)) {
      eventId = s.eventId.$oid;
    } else {
      eventId = undefined;
    }

    return {
      ...s,
      eventId,
      clientId: s.clientId ?? nanoid(),
      order: s.order ?? i,
      injectAtStep: s.injectAtStep ?? i,
      tags: s.tags ?? [],
    };
  });
}

function normalizeScenario(raw: ScenarioInput): Scenario {
  const rawSteps = Array.isArray(raw.steps)
    ? raw.steps
    : Array.isArray(raw.events)
    ? raw.events
    : [];

  return {
    _id: raw._id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description ?? '',
    domain: raw.domain || 'defense',
    tags: raw.tags ?? [],
    isActive: raw.isActive ?? true,
    runConfig: raw.runConfig ?? {
      autoAdvance: true,
      maxSteps: null,
    },
    steps: normalizeSteps(rawSteps),
  };
}

/* ---------------------------------------------------------
   Page
--------------------------------------------------------- */

const ScenarioWorkbenchPage: React.FC = () => {
  const router = useRouter();

  const [domainFilter, setDomainFilter] =
    useState<DomainFilter>('defense');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [, setLoadingList] = useState(false);
  const [, setListError] = useState<string | null>(null);

  const [selectedScenarioId, setSelectedScenarioId] =
    useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] =
    useState<Scenario | null>(null);
  const [, setLoadingScenario] = useState(false);
  const [, setScenarioError] =
    useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // ---- Editor state ----
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] =
    useState<'create' | 'edit'>('create');
  const [draftScenario, setDraftScenario] =
    useState<Scenario | null>(null);
  const [savingScenario, setSavingScenario] =
    useState(false);

  // ---- Events list ----
  const [eventOptions, setEventOptions] = useState<EventSummary[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] =
    useState<string | null>(null);

  /* ---------------------------------------------------------
     Load scenario list
  --------------------------------------------------------- */
  useEffect(() => {
    async function loadList() {
      setLoadingList(true);
      setListError(null);

      try {
        const params = new URLSearchParams();
        if (domainFilter !== 'all')
          params.set('domain', domainFilter);
        if (tagFilter.trim())
          params.set('tags', tagFilter.trim());
        if (search.trim())
          params.set('search', search.trim());

        const res = await fetch(
          `${API_BASE}/api/scenarios?${params.toString()}`,
        );
        if (!res.ok)
          throw new Error(
            `Failed to load scenarios: ${res.status}`,
          );

        const json = (await res.json()) as Scenario[];
        const normalized = json.map(normalizeScenario);
        setScenarios(normalized);

        if (!selectedScenarioId && normalized.length > 0) {
          setSelectedScenarioId(
            normalized[0]._id as string,
          );
        }
      } catch (err) {
        setListError(
          err instanceof Error
            ? err.message
            : 'Failed to load scenarios.',
        );
      } finally {
        setLoadingList(false);
      }
    }

    void loadList();
  }, [domainFilter, search, tagFilter, selectedScenarioId]);

  /* ---------------------------------------------------------
     Load selected scenario
  --------------------------------------------------------- */
  useEffect(() => {
    if (!selectedScenarioId) {
      setSelectedScenario(null);
      return;
    }

    async function loadScenario() {
      setLoadingScenario(true);
      setScenarioError(null);

      try {
        const res = await fetch(
          `${API_BASE}/api/scenarios/${selectedScenarioId}`,
        );
        if (!res.ok)
          throw new Error(
            `Failed to load scenario: ${res.status}`,
          );

        const json = (await res.json()) as Scenario;
        setSelectedScenario(normalizeScenario(json));
      } catch (err) {
        setScenarioError(
          err instanceof Error
            ? err.message
            : 'Failed to load scenario.',
        );
      } finally {
        setLoadingScenario(false);
      }
    }

    void loadScenario();
  }, [selectedScenarioId]);

  /* ---------------------------------------------------------
     Load events (editor dropdown)
  --------------------------------------------------------- */
  useEffect(() => {
    async function loadEvents() {
      setLoadingEvents(true);
      setEventsError(null);

      try {
        const res = await fetch(
          `${API_BASE}/api/events?limit=200`,
        );
        if (!res.ok)
          throw new Error(
            `Failed to load events: ${res.status}`,
          );

        const json = (await res.json()) as EventSummary[];
        setEventOptions(
          json.map((e) => ({
            ...e,
            parsed: e.parsed ?? {},
          })),
        );
      } catch (err) {
        setEventsError(
          err instanceof Error
            ? err.message
            : 'Failed to load events.',
        );
      } finally {
        setLoadingEvents(false);
      }
    }

    void loadEvents();
  }, []);

  /* ---------------------------------------------------------
     Derived
  --------------------------------------------------------- */
  const scenarioSteps = useMemo(() => {
    if (!selectedScenario) return [];
    return [...selectedScenario.steps].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
  }, [selectedScenario]);

  /* ---------------------------------------------------------
     Run scenario
  --------------------------------------------------------- */
  async function handleRunScenario() {
    if (!selectedScenario?._id) return;
    setRunning(true);
    setRunError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/cognition/run-scenario`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: selectedScenario._id,
            maxSteps:
              selectedScenario.runConfig?.maxSteps ??
              undefined,
          }),
        },
      );

      if (!res.ok)
        throw new Error(
          `Failed to run scenario: ${res.status}`,
        );

      const { runId } = await res.json();
      router.push(`/model/world/${runId}`);
    } catch (err) {
      setRunError(
        err instanceof Error
          ? err.message
          : 'Failed to run scenario.',
      );
    } finally {
      setRunning(false);
    }
  }

  /* ---------------------------------------------------------
     Editor controls
  --------------------------------------------------------- */
  function openCreateScenario() {
    setDraftScenario({
      name: '',
      domain: 'defense',
      description: '',
      tags: [],
      isActive: true,
      steps: [],
      runConfig: { autoAdvance: true, maxSteps: null },
    });
    setEditorMode('create');
    setShowEditor(true);
  }

  function openEditScenario() {
    if (!selectedScenario) return;
    setDraftScenario(structuredClone(selectedScenario));
    setEditorMode('edit');
    setShowEditor(true);
  }

  function closeEditor() {
    setShowEditor(false);
    setDraftScenario(null);
    setSavingScenario(false);
  }

  async function handleSaveScenario() {
    if (!draftScenario) return;
    setSavingScenario(true);

    try {
      const method = editorMode === 'create' ? 'POST' : 'PUT';
      const url =
        editorMode === 'create'
          ? `${API_BASE}/api/scenarios`
          : `${API_BASE}/api/scenarios/${draftScenario._id}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftScenario),
      });

      if (!res.ok)
        throw new Error(
          `Failed to save scenario: ${res.status}`,
        );

      const saved = normalizeScenario(
        (await res.json()) as Scenario,
      );

      setScenarios((prev) =>
        editorMode === 'create'
          ? [saved, ...prev]
          : prev.map((s) =>
              s._id === saved._id ? saved : s,
            ),
      );

      setSelectedScenario(saved);
      setSelectedScenarioId(saved._id as string);
      closeEditor();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to save scenario.',
      );
      setSavingScenario(false);
    }
  }

  /* ---------------------------------------------------------
     Render
  --------------------------------------------------------- */
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-lg font-semibold text-white">
          Scenario Workbench
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Browse, edit, and run multi-step scenarios.
        </p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800 space-y-2 text-xs">
            <select
              value={domainFilter}
              onChange={(e) =>
                setDomainFilter(
                  e.target.value as DomainFilter,
                )
              }
              className="w-full bg-black/40 border rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="defense">Defense</option>
              <option value="political">Political</option>
              <option value="economic">Economic</option>
              <option value="general">General</option>
            </select>

            <input
              placeholder="Tag filter"
              value={tagFilter}
              onChange={(e) =>
                setTagFilter(e.target.value)
              }
              className="w-full bg-black/40 border rounded px-2 py-1"
            />

            <input
              placeholder="Search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full bg-black/40 border rounded px-2 py-1"
            />
          </div>

          <ul className="flex-1 overflow-auto divide-y divide-gray-800 text-xs">
            {scenarios.map((s) => {
              const id = s._id as string;
              return (
                <li
                  key={id}
                  onClick={() =>
                    setSelectedScenarioId(id)
                  }
                  className={`px-3 py-2 cursor-pointer ${
                    selectedScenarioId === id
                      ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                      : 'hover:bg-gray-900/50'
                  }`}
                >
                  <div className="text-gray-100">
                    {s.name}
                  </div>
                  <div className="text-gray-500">
                    {s.steps.length} steps
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-gray-800 p-2">
            <button
              onClick={openCreateScenario}
              className="w-full border rounded py-1 text-xs"
            >
              + Create Scenario
            </button>
          </div>
        </aside>

        {/* Main */}
        <section className="flex-1 p-6 overflow-auto relative">
          {showEditor && draftScenario && (
            <div className="absolute inset-0 bg-black/70 z-20 flex justify-center items-center">
              <div className="w-full max-w-4xl bg-[#050708] border rounded-xl p-4">
                {loadingEvents && (
                  <div className="text-xs text-gray-400">
                    Loading events…
                  </div>
                )}
                {eventsError && (
                  <div className="text-xs text-red-400">
                    {eventsError}
                  </div>
                )}
                <ScenarioEditor
                  value={draftScenario}
                  events={eventOptions}
                  mode={editorMode}
                  onChange={setDraftScenario}
                  onCancel={closeEditor}
                  onSave={handleSaveScenario}
                  isSaving={savingScenario}
                />
              </div>
            </div>
          )}

          {!showEditor && selectedScenario && (
            <>
              <ScenarioTimeline steps={scenarioSteps} />
              <ScenarioRunPanel
                scenario={selectedScenario}
                running={running}
                runError={runError}
                onRun={handleRunScenario}
                onEdit={openEditScenario}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   Timeline + Run panel (unchanged logic)
--------------------------------------------------------- */

const ScenarioTimeline = ({
  steps,
}: {
  steps: ScenarioStep[];
}) => (
  <div className="border border-gray-800 rounded-xl bg-black/40 px-4 py-3 mb-4">
    <h3 className="text-xs text-gray-300 mb-2">
      Scenario Timeline
    </h3>
    <ol className="space-y-2 text-xs">
      {steps.map((s, i) => (
        <li key={s._id ?? s.clientId}>
          {s.label ?? `Step ${i}`}
        </li>
      ))}
    </ol>
  </div>
);

const ScenarioRunPanel = ({
  scenario,
  running,
  runError,
  onRun,
  onEdit,
}: {
  scenario: Scenario;
  running: boolean;
  runError: string | null;
  onRun: () => void;
  onEdit: () => void;
}) => (
  <div className="border border-gray-800 rounded-xl bg-black/40 px-4 py-3 text-xs">
    <div className="mb-2">
      Ready to simulate{' '}
      <strong>{scenario.name}</strong>?
    </div>
    {runError && (
      <div className="text-red-400">{runError}</div>
    )}
    <div className="flex gap-2">
      <button
        onClick={onEdit}
        className="border rounded px-3 py-1"
      >
        Edit
      </button>
      <button
        onClick={onRun}
        disabled={running}
        className="border border-emerald-500 bg-emerald-500 text-black rounded px-3 py-1"
      >
        {running ? 'Running…' : 'Run Scenario'}
      </button>
    </div>
  </div>
);

export default ScenarioWorkbenchPage;
