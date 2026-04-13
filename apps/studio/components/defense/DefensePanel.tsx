'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SliderRow } from '@/components/studio/SliderRow';
import { SaveBar } from '@/components/studio/SaveBar';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

type DefenseTopic = {
  key: string;
  label: string;
  stance: number;      // -1 → 1
  certainty: number;   // 0 → 1
  volatility: number;  // 0 → 1
  category?: string;
};

type SliderKey = 'stance' | 'certainty' | 'volatility';

/* ------------------------------------------------------------------ */
/* Slider config */
/* ------------------------------------------------------------------ */

const SLIDERS = [
  {
    key: 'stance',
    label: 'Stance',
    description: 'Baseline strategic posture (dovish ↔ hawkish).',
    min: -1,
    max: 1,
    step: 0.01,
    defaultValue: 0,
  },
  {
    key: 'certainty',
    label: 'Certainty',
    description: 'Confidence and rigidity of the stance.',
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.5,
  },
  {
    key: 'volatility',
    label: 'Volatility',
    description: 'How reactive this theater is to new events.',
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.5,
  },
] as const;

/* ------------------------------------------------------------------ */
/* Page */
/* ------------------------------------------------------------------ */

export default function DefenseSettingsPage() {
  const [topics, setTopics] = useState<DefenseTopic[]>([]);
  const [original, setOriginal] = useState<DefenseTopic[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const update = () => setIsMobile(window.innerWidth < 1024);
  update();
  window.addEventListener('resize', update);
  return () => window.removeEventListener('resize', update);
}, []);

  /* ---------- load ---------- */

  useEffect(() => {
    fetch(`${API_BASE}/defense/topics`)
      .then((r) => r.json())
      .then((data: DefenseTopic[]) => {
        setTopics(data);
        setOriginal(data);
        setActiveKey(data[0]?.key ?? null);
      });
  }, []);

  /* ---------- derived ---------- */

  const active = useMemo(
    () => topics.find((t) => t.key === activeKey) ?? null,
    [topics, activeKey]
  );

  const isDirty = useMemo(
    () => JSON.stringify(topics) !== JSON.stringify(original),
    [topics, original]
  );

  /* ---------- handlers ---------- */

  const updateField = (key: SliderKey, value: number) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.key === activeKey ? { ...t, [key]: value } : t
      )
    );
  };

  const resetField = (key: SliderKey) => {
    const def = SLIDERS.find((s) => s.key === key)?.defaultValue;
    if (def == null || !activeKey) return;

    setTopics((prev) =>
      prev.map((t) =>
        t.key === activeKey ? { ...t, [key]: def } : t
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/defense/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics }),
      });

      if (!res.ok) throw new Error('Save failed');

      setOriginal(topics);
    } finally {
      setSaving(false);
    }
  };

  if (!topics.length || !active) {
    return (
      <div className="p-6 text-sm text-gray-400">
        Loading defense settings…
      </div>
    );
  }

  /* ---------- layout ---------- */

  return (
  <div className="flex h-full">
    {/* LEFT RAIL (desktop only) */}
    {!isMobile && (
      <aside className="w-64 border-r border-gray-800 px-4 py-4 space-y-6">
        <div>
          <h1 className="text-sm font-semibold text-gray-100">
            Defense Settings
          </h1>
          <p className="text-xs text-gray-500">
            Theater-level baselines
          </p>
        </div>

        <div className="space-y-1">
          {topics.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveKey(t.key)}
              className={[
                'w-full text-left px-3 py-1.5 rounded text-xs transition',
                t.key === activeKey
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-gray-200',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </aside>
    )}

    {/* MAIN */}
    <main className="flex-1 overflow-auto px-6 py-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* MOBILE SELECTOR */}
        {isMobile && (
          <select
            value={activeKey ?? ''}
            onChange={(e) => setActiveKey(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm"
          >
            {topics.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        )}

        <div>
          <h2 className="text-sm font-semibold text-gray-100">
            {active.label}
          </h2>
          <p className="text-xs text-gray-500">
            Configure baseline stance, certainty, and volatility.
          </p>
        </div>

        <div className="rounded-lg border border-gray-800 bg-black/40 p-5 space-y-6">
          {SLIDERS.map((field) => (
            <SliderRow
              key={field.key}
              field={field}
              value={active[field.key]}
              onChange={updateField}
              onReset={resetField}
              intent="tuning"
            />
          ))}
        </div>
      </div>
    </main>

    <SaveBar
      dirty={isDirty}
      saving={saving}
      label="Unsaved changes to defense settings"
      onDiscard={() => setTopics(original)}
      onSave={handleSave}
    />
  </div>
);

}
