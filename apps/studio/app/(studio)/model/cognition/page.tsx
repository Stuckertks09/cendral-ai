'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SaveBar } from '@/components/studio/SaveBar';
import { SliderRow } from '@/components/studio/SliderRow';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

type GlobalSliderKey =
  | 'emotionalReactivity'
  | 'beliefPlasticity'
  | 'crossTopicInfluence'
  | 'moodDecayRate'
  | 'trustWeight'
  | 'identityProtection'
  | 'noveltySensitivity'
  | 'globalChaos';

type CognitionSection =
  | 'emotion'
  | 'belief'
  | 'influence'
  | 'stochastic';

interface CognitionSettings {
  emotionalReactivity: number;
  beliefPlasticity: number;
  crossTopicInfluence: number;
  moodDecayRate: number;
  trustWeight: number;
  identityProtection: number;
  noveltySensitivity: number;
  globalChaos: number;
}

interface SliderConfig {
  key: GlobalSliderKey;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  section: CognitionSection;
}

/* ------------------------------------------------------------------ */
/* Config */
/* ------------------------------------------------------------------ */

const SLIDERS: SliderConfig[] = [
  {
    key: 'emotionalReactivity',
    label: 'Emotional Reactivity',
    description: 'How strongly mood and arousal respond to events.',
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    section: 'emotion',
  },
  {
    key: 'moodDecayRate',
    label: 'Mood Decay Rate',
    description: 'How quickly mood returns to baseline between events.',
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    section: 'emotion',
  },
  {
    key: 'beliefPlasticity',
    label: 'Belief Plasticity',
    description: 'How quickly beliefs update when exposed to persuasion.',
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    section: 'belief',
  },
  {
    key: 'crossTopicInfluence',
    label: 'Cross-Topic Influence',
    description: 'How much events in one topic bleed into others.',
    min: 0,
    max: 3,
    step: 0.05,
    defaultValue: 1.5,
    section: 'belief',
  },
  {
    key: 'trustWeight',
    label: 'Trust Weight',
    description: 'Amplifies the effect of trusted sources.',
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    section: 'influence',
  },
  {
    key: 'identityProtection',
    label: 'Identity Protection',
    description: 'Resistance to belief change when identity is threatened.',
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    section: 'influence',
  },
  {
    key: 'noveltySensitivity',
    label: 'Novelty Sensitivity',
    description: 'Responsiveness to new or rare events.',
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    section: 'stochastic',
  },
  {
    key: 'globalChaos',
    label: 'Global Chaos',
    description: 'Adds stochastic variability to outcomes.',
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    section: 'stochastic',
  },
];

const DEFAULT_SETTINGS: CognitionSettings = {
  emotionalReactivity: 1,
  beliefPlasticity: 1,
  crossTopicInfluence: 1.5,
  moodDecayRate: 1,
  trustWeight: 1,
  identityProtection: 1,
  noveltySensitivity: 1,
  globalChaos: 1,
};

/* ------------------------------------------------------------------ */
/* Page */
/* ------------------------------------------------------------------ */

export default function CognitionSettingsPage() {
  const [settings, setSettings] =
    useState<CognitionSettings | null>(null);
  const [original, setOriginal] =
    useState<CognitionSettings | null>(null);
  const [activeSection, setActiveSection] =
    useState<CognitionSection>('emotion');
  const [saving, setSaving] = useState(false);

  /* ---------- load ---------- */

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/cognition`)
      .then((r) => r.json())
      .then((data) => {
        const effective = { ...DEFAULT_SETTINGS, ...data };
        setSettings(effective);
        setOriginal(effective);
      });
  }, []);

  /* ---------- derived ---------- */

  const isDirty = useMemo(() => {
    if (!settings || !original) return false;
    return JSON.stringify(settings) !== JSON.stringify(original);
  }, [settings, original]);

  if (!settings) {
    return <div className="p-6 text-sm text-gray-400">Loading…</div>;
  }

  const visible = SLIDERS.filter(
    (s) => s.section === activeSection,
  );

  /* ---------- handlers ---------- */

  const updateField = (key: GlobalSliderKey, value: number) => {
    setSettings((prev) =>
      prev ? { ...prev, [key]: value } : prev,
    );
  };

  const resetField = (key: GlobalSliderKey) => {
    const def = SLIDERS.find((s) => s.key === key)?.defaultValue;
    if (def !== undefined) updateField(key, def);
  };

  /* ---------- layout ---------- */

  return (
    <div className="flex h-full">
      {/* LEFT RAIL */}
      <aside className="w-64 border-r border-gray-800 px-4 py-4 space-y-6">
        <div>
          <h1 className="text-sm font-semibold text-gray-100">
            Cognition Settings
          </h1>
          <p className="text-xs text-gray-500">
            Agent-level controls
          </p>
        </div>

        <div className="space-y-1">
          {(
            [
              ['emotion', 'Emotion'],
              ['belief', 'Beliefs'],
              ['influence', 'Influence'],
              ['stochastic', 'Noise'],
            ] as [CognitionSection, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={[
                'w-full text-left px-3 py-1.5 rounded text-xs transition',
                key === activeSection
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-gray-200',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-gray-800 bg-black/40 p-5 space-y-6">
            {visible.map((field) => (
              <SliderRow
                key={field.key}
                field={field}
                value={settings[field.key]}
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
        label="Unsaved changes to cognition settings"
        onDiscard={() => setSettings(original)}
        onSave={() => {}}
      />
    </div>
  );
}
