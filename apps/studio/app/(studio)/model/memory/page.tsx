'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SaveBar } from '@/components/studio/SaveBar';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

type MemorySection = 'sources' | 'recall' | 'weights';

type MemoryBooleanKey = 'useSemanticMemory' | 'useGraphMemory';

type MemoryNumericKey =
  | 'semanticTopKPersona'
  | 'semanticTopKActor'
  | 'semanticTopKLeader'
  | 'semanticTopKEvents'
  | 'semanticWeight'
  | 'relationalWeight'
  | 'episodicWeight';

export interface MemorySettings {
  useSemanticMemory: boolean;
  useGraphMemory: boolean;

  semanticTopKPersona: number;
  semanticTopKActor: number;
  semanticTopKLeader: number;
  semanticTopKEvents: number;

  semanticWeight: number;
  relationalWeight: number;
  episodicWeight: number;
}

interface SliderConfig {
  key: MemoryNumericKey;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  section: 'recall' | 'weights';
}

/* ------------------------------------------------------------------ */
/* Config */
/* ------------------------------------------------------------------ */

const SLIDERS: SliderConfig[] = [
  {
    key: 'semanticTopKPersona',
    label: 'Persona Memory Depth',
    description: 'Number of persona memories retrieved per query.',
    min: 1,
    max: 32,
    step: 1,
    defaultValue: 5,
    section: 'recall',
  },
  {
    key: 'semanticTopKActor',
    label: 'Actor Memory Depth',
    description: 'Doctrine and historical actor memories.',
    min: 1,
    max: 32,
    step: 1,
    defaultValue: 5,
    section: 'recall',
  },
  {
    key: 'semanticTopKLeader',
    label: 'Leader Memory Depth',
    description: 'Leader-specific crisis and decision memories.',
    min: 1,
    max: 32,
    step: 1,
    defaultValue: 5,
    section: 'recall',
  },
  {
    key: 'semanticTopKEvents',
    label: 'Event Memory Depth',
    description: 'Relevant historical world events.',
    min: 1,
    max: 32,
    step: 1,
    defaultValue: 5,
    section: 'recall',
  },
  {
    key: 'semanticWeight',
    label: 'Semantic Memory Weight',
    description: 'Influence of vector recall during arbitration.',
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    section: 'weights',
  },
  {
    key: 'relationalWeight',
    label: 'Graph Memory Weight',
    description: 'Influence of alliance and hostility structure.',
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    section: 'weights',
  },
  {
    key: 'episodicWeight',
    label: 'Episodic Memory Weight',
    description: 'Bias from recent world-state snapshots.',
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    section: 'weights',
  },
];

const DEFAULTS: MemorySettings = {
  useSemanticMemory: true,
  useGraphMemory: true,
  semanticTopKPersona: 5,
  semanticTopKActor: 5,
  semanticTopKLeader: 5,
  semanticTopKEvents: 5,
  semanticWeight: 1,
  relationalWeight: 1,
  episodicWeight: 1,
};

/* ------------------------------------------------------------------ */
/* Page */
/* ------------------------------------------------------------------ */

export default function MemorySettingsPage() {
  const [settings, setSettings] = useState<MemorySettings | null>(null);
  const [original, setOriginal] = useState<MemorySettings | null>(null);
  const [active, setActive] = useState<MemorySection>('sources');
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* ---------------- Responsive ---------------- */

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* ---------------- Load ---------------- */

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/memory`)
      .then((r) => r.json())
      .then((data) => {
        const merged = { ...DEFAULTS, ...data };
        setSettings(merged);
        setOriginal(merged);
      })
      .catch(() => {
        setSettings(DEFAULTS);
        setOriginal(DEFAULTS);
      });
  }, []);

  /* ---------------- Dirty ---------------- */

  const isDirty = useMemo(() => {
    if (!settings || !original) return false;
    return JSON.stringify(settings) !== JSON.stringify(original);
  }, [settings, original]);

  /* ---------------- Handlers ---------------- */

  const toggle = (key: MemoryBooleanKey) =>
    settings &&
    setSettings({ ...settings, [key]: !settings[key] });

  const update = (key: MemoryNumericKey, value: number) =>
    settings && setSettings({ ...settings, [key]: value });

  const reset = (key: MemoryNumericKey) => {
    const def = SLIDERS.find((s) => s.key === key)?.defaultValue;
    if (def !== undefined && settings)
      setSettings({ ...settings, [key]: def });
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch(`${API_BASE}/api/settings/memory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setOriginal(settings);
    setSaving(false);
  };

  if (!settings) {
    return <div className="p-6 text-sm text-gray-400">Loading…</div>;
  }

  const recall = SLIDERS.filter((s) => s.section === 'recall');
  const weights = SLIDERS.filter((s) => s.section === 'weights');

  /* ---------------- Render ---------------- */

  return (
    <div className="flex h-full">
      {/* LEFT RAIL */}
      {!isMobile && (
        <aside className="w-64 border-r border-gray-800 p-4 space-y-6">
          <div>
            <h1 className="text-sm font-semibold text-white">
              Memory Settings
            </h1>
            <p className="text-xs text-gray-500">
              Recall + weighting controls
            </p>
          </div>

          {(['sources', 'recall', 'weights'] as MemorySection[]).map(
            (key) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={[
                  'w-full text-left px-3 py-1.5 rounded text-xs transition',
                  active === key
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-gray-200',
                ].join(' ')}
              >
                {key[0].toUpperCase() + key.slice(1)}
              </button>
            ),
          )}
        </aside>
      )}

      {/* MAIN */}
      <main className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {isMobile && (
            <select
              value={active}
              onChange={(e) =>
                setActive(e.target.value as MemorySection)
              }
              className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm"
            >
              <option value="sources">Sources</option>
              <option value="recall">Recall</option>
              <option value="weights">Weights</option>
            </select>
          )}

          {active === 'sources' && (
            <div className="space-y-4">
              <Toggle
                label="Semantic Memory"
                description="Vector recall (Pinecone)"
                checked={settings.useSemanticMemory}
                onClick={() => toggle('useSemanticMemory')}
              />
              <Toggle
                label="Graph Memory"
                description="Alliance / hostility (Neo4j)"
                checked={settings.useGraphMemory}
                onClick={() => toggle('useGraphMemory')}
              />
            </div>
          )}

          {(active === 'recall' ? recall : active === 'weights' ? weights : [])
            .map((s) => (
              <Slider
                key={s.key}
                config={s}
                value={settings[s.key]}
                onChange={update}
                onReset={reset}
              />
            ))}
        </div>
      </main>

      <SaveBar
        dirty={isDirty}
        saving={saving}
        label="Unsaved memory changes"
        onDiscard={() => setSettings(original)}
        onSave={save}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Primitives */
/* ------------------------------------------------------------------ */

function Toggle({
  label,
  description,
  checked,
  onClick,
}: {
  label: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full border border-gray-800 rounded-lg px-4 py-3 bg-black/40 flex justify-between"
    >
      <div>
        <div className="text-xs font-medium text-white">{label}</div>
        <div className="text-[11px] text-gray-400">{description}</div>
      </div>
      <div
        className={[
          'w-10 h-5 rounded-full flex items-center px-0.5',
          checked ? 'bg-emerald-500' : 'bg-gray-700',
        ].join(' ')}
      >
        <div
          className={[
            'w-4 h-4 bg-black rounded-full transition',
            checked ? 'translate-x-5' : '',
          ].join(' ')}
        />
      </div>
    </button>
  );
}

function Slider({
  config,
  value,
  onChange,
  onReset,
}: {
  config: SliderConfig;
  value: number;
  onChange: (k: MemoryNumericKey, v: number) => void;
  onReset: (k: MemoryNumericKey) => void;
}) {
  const isDefault =
    Math.abs(value - config.defaultValue) < config.step / 2;

  return (
    <div className="border border-gray-800 rounded-lg px-4 py-3 bg-black/40">
      <div className="flex justify-between mb-1">
        <div>
          <div className="text-xs font-medium text-white">
            {config.label}
          </div>
          <div className="text-[11px] text-gray-400">
            {config.description}
          </div>
        </div>
        {!isDefault && (
          <button
            onClick={() => onReset(config.key)}
            className="text-[11px] text-gray-400 hover:text-gray-200"
          >
            reset
          </button>
        )}
      </div>

      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={(e) =>
          onChange(config.key, Number(e.target.value))
        }
        className="w-full accent-emerald-500"
      />
    </div>
  );
}
