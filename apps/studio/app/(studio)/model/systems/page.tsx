// app/model/systems/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

  

type SystemKey = 'economic' | 'environment' | 'info' | 'population';
type SectionKey = 'shocks' | 'dynamics' | 'structure' | 'noise';

export interface SystemSettings {
  _id?: string;
  updatedAt?: string;
  economic: Record<string, number>;
  environment: Record<string, number>;
  info: Record<string, number>;
  population: Record<string, number>;
}

// MUST mirror backend DEFAULT_SYSTEM_SETTINGS
const DEFAULT_SYSTEMS: Omit<SystemSettings, '_id' | 'updatedAt'> = {
  economic: {
    inflationSensitivity: 1,
    growthSensitivity: 1,
    unemploymentElasticity: 1,
    marketMomentumWeight: 1,
    volatilityDecayRate: 0.03,
    liquiditySensitivity: 1,
    shockPropagationStrength: 1,
    shockDecayModifier: 1,
    shockAmplification: 1,
    correlationStrengthMultiplier: 1,
    sectorOutputElasticity: 1,
    sectorStressAmplifier: 1,
    householdStressSensitivity: 1,
    corporateStressSensitivity: 1,
    sovereignStressSensitivity: 1,
    economicNoise: 0.02,
    marketNoise: 0.02,
    shockNoise: 0.02
  },
  environment: {
    seasonDriftRate: 0.02,
    baseDisasterRate: 0.001,
    disasterMaxRate: 0.05,
    climateTrendStrength: 0.001,
    resourceSensitivity: 1.0,
    disasterDecayRate: 0.05,
    envNoise: 0.01
  },
  info: {
    attentionVolatility: 0.1,
    disinfoSensitivity: 1.0,
    censorshipImpact: 1.0,
    connectivityResilience: 0.9,
    baseEntropyDrift: 0.02,
    noise: 0.02
  },
  population: {
    baselineGrowthRate: 0.005,
    fertilityBase: 0.02,
    mortalityBase: 0.01,
    migrationVolatility: 0.02,
    urbanizationDrift: 0.002,
    trustReversionRate: 0.02,
    demoShockSensitivity: 1.0,
    inequalityDrift: 0.005,
    diversityDrift: 0.002,
    randomNoise: 0.01
  }
};

function withSystemDefaults(partial: Partial<SystemSettings> | null): SystemSettings {
  const base: SystemSettings = {
    economic: { ...DEFAULT_SYSTEMS.economic },
    environment: { ...DEFAULT_SYSTEMS.environment },
    info: { ...DEFAULT_SYSTEMS.info },
    population: { ...DEFAULT_SYSTEMS.population }
  };

  if (!partial) return base;

  return {
    _id: partial._id,
    updatedAt: partial.updatedAt,
    economic: { ...DEFAULT_SYSTEMS.economic, ...(partial.economic ?? {}) },
    environment: { ...DEFAULT_SYSTEMS.environment, ...(partial.environment ?? {}) },
    info: { ...DEFAULT_SYSTEMS.info, ...(partial.info ?? {}) },
    population: { ...DEFAULT_SYSTEMS.population, ...(partial.population ?? {}) }
  };
}

interface FieldConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  section: 'dynamics' | 'shocks' | 'noise' | 'structure';
  description: string;
}

interface SystemConfig {
  label: string;
  description: string;
  fields: FieldConfig[];
}

const SYSTEM_CONFIGS: Record<SystemKey, SystemConfig> = {
  economic: {
    label: 'Economic System',
    description:
      'Controls how inflation, growth, unemployment, and market volatility respond to shocks and drift over time.',
    fields: [
      {
        key: 'inflationSensitivity',
        label: 'Inflation Sensitivity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'shocks',
        description: 'How strongly inflation responds to inflation_shock events.'
      },
      {
        key: 'growthSensitivity',
        label: 'Growth Sensitivity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'shocks',
        description: 'How much GDP growth reacts to supply-side shocks.'
      },
      {
        key: 'unemploymentElasticity',
        label: 'Unemployment Elasticity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'shocks',
        description: 'Amplifies unemployment response to negative events.'
      },
      {
        key: 'marketMomentumWeight',
        label: 'Market Momentum Weight',
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 1,
        section: 'dynamics',
        description: 'How much past momentum carries forward each step.'
      },
      {
        key: 'volatilityDecayRate',
        label: 'Volatility Decay Rate',
        min: 0,
        max: 0.2,
        step: 0.005,
        defaultValue: 0.03,
        section: 'dynamics',
        description: 'Speed at which market volatility returns toward baseline.'
      },
      {
        key: 'liquiditySensitivity',
        label: 'Liquidity Sensitivity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'shocks',
        description: 'Impact of financial shocks on liquidity.'
      },
      {
        key: 'shockPropagationStrength',
        label: 'Shock Propagation Strength',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'shocks',
        description: 'How strongly shocks bleed into volatility and other metrics.'
      },
      {
        key: 'shockDecayModifier',
        label: 'Shock Decay Modifier',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'dynamics',
        description: 'Scales how quickly economic shocks fade over time.'
      },
      {
        key: 'shockAmplification',
        label: 'Shock Amplification',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'shocks',
        description: 'Multiplier applied to the initial magnitude of shocks.'
      },
      {
        key: 'correlationStrengthMultiplier',
        label: 'Correlation Strength Multiplier',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'structure',
        description: 'Controls coupling between sectors and markets.'
      },
      {
        key: 'sectorOutputElasticity',
        label: 'Sector Output Elasticity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'structure',
        description: 'Responsiveness of sector output to shocks and base growth.'
      },
      {
        key: 'sectorStressAmplifier',
        label: 'Sector Stress Amplifier',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'structure',
        description: 'Amplifies stress in fragile sectors when shocks occur.'
      },
      {
        key: 'householdStressSensitivity',
        label: 'Household Stress Sensitivity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'structure',
        description: 'How strongly households react to macroeconomic stress.'
      },
      {
        key: 'corporateStressSensitivity',
        label: 'Corporate Stress Sensitivity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'structure',
        description: 'How strongly firms react to volatility and liquidity shifts.'
      },
      {
        key: 'sovereignStressSensitivity',
        label: 'Sovereign Stress Sensitivity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'structure',
        description: 'How sensitive sovereign risk is to economic conditions.'
      },
      {
        key: 'economicNoise',
        label: 'Economic Noise',
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.02,
        section: 'noise',
        description: 'Random jitter on inflation and growth each step.'
      },
      {
        key: 'marketNoise',
        label: 'Market Noise',
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.02,
        section: 'noise',
        description: 'Random jitter on market volatility.'
      },
      {
        key: 'shockNoise',
        label: 'Shock Noise',
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.02,
        section: 'noise',
        description: 'Noise applied when shocks are spawned or decayed.'
      }
    ]
  },
  environment: {
    label: 'Environment System',
    description:
      'Controls climate drift, disaster frequency, and resource stress (energy, food, water).',
    fields: [
      {
        key: 'seasonDriftRate',
        label: 'Season Drift Rate',
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.02,
        section: 'dynamics',
        description: 'Speed of seasonal cycle across the 0–1 year index.'
      },
      {
        key: 'baseDisasterRate',
        label: 'Base Disaster Rate',
        min: 0,
        max: 0.02,
        step: 0.001,
        defaultValue: 0.001,
        section: 'shocks',
        description: 'Baseline probability of disasters per step.'
      },
      {
        key: 'disasterMaxRate',
        label: 'Max Disaster Rate',
        min: 0,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.05,
        section: 'shocks',
        description: 'Upper cap on disaster probability when risk is high.'
      },
      {
        key: 'climateTrendStrength',
        label: 'Climate Trend Strength',
        min: 0,
        max: 0.01,
        step: 0.0005,
        defaultValue: 0.001,
        section: 'dynamics',
        description: 'Long-run warming (or cooling) trend strength.'
      },
      {
        key: 'resourceSensitivity',
        label: 'Resource Sensitivity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'structure',
        description: 'How strongly resource stress reacts to events.'
      },
      {
        key: 'disasterDecayRate',
        label: 'Disaster Decay Rate',
        min: 0,
        max: 0.2,
        step: 0.01,
        defaultValue: 0.05,
        section: 'dynamics',
        description: 'Speed at which active disasters lose severity.'
      },
      {
        key: 'envNoise',
        label: 'Environmental Noise',
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.01,
        section: 'noise',
        description: 'Random jitter on stress and risk metrics.'
      }
    ]
  },
  info: {
    label: 'Information Flow System',
    description:
      'Controls media load, misinformation, censorship, and how attention moves across topics.',
    fields: [
      {
        key: 'attentionVolatility',
        label: 'Attention Volatility',
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
        section: 'dynamics',
        description: 'How quickly attention shifts between topics.'
      },
      {
        key: 'disinfoSensitivity',
        label: 'Disinfo Sensitivity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'shocks',
        description: 'Impact factor for disinformation campaigns.'
      },
      {
        key: 'censorshipImpact',
        label: 'Censorship Impact',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'shocks',
        description: 'Strength of censorship events on entropy and flow.'
      },
      {
        key: 'connectivityResilience',
        label: 'Connectivity Resilience',
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.9,
        section: 'structure',
        description: 'How robust connectivity is to infrastructure outages.'
      },
      {
        key: 'baseEntropyDrift',
        label: 'Entropy Drift',
        min: 0,
        max: 0.2,
        step: 0.01,
        defaultValue: 0.02,
        section: 'dynamics',
        description: 'How quickly attention spreads back out over topics.'
      },
      {
        key: 'noise',
        label: 'Information Noise',
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.02,
        section: 'noise',
        description: 'Random jitter on media load and indices.'
      }
    ]
  },
  population: {
    label: 'Population System',
    description:
      'Controls demographic drift, migration, inequality, diversity, and social trust dynamics.',
    fields: [
      {
        key: 'baselineGrowthRate',
        label: 'Baseline Growth Rate',
        min: 0,
        max: 0.02,
        step: 0.001,
        defaultValue: 0.005,
        section: 'dynamics',
        description: 'Underlying population growth rate per step.'
      },
      {
        key: 'fertilityBase',
        label: 'Fertility Base',
        min: 0,
        max: 0.05,
        step: 0.001,
        defaultValue: 0.02,
        section: 'dynamics',
        description: 'Fertility multiplier for births calculation.'
      },
      {
        key: 'mortalityBase',
        label: 'Mortality Base',
        min: 0,
        max: 0.05,
        step: 0.001,
        defaultValue: 0.01,
        section: 'dynamics',
        description: 'Mortality multiplier for deaths calculation.'
      },
      {
        key: 'migrationVolatility',
        label: 'Migration Volatility',
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.02,
        section: 'dynamics',
        description: 'How noisy migration flows are over time.'
      },
      {
        key: 'urbanizationDrift',
        label: 'Urbanization Drift',
        min: 0,
        max: 0.01,
        step: 0.0005,
        defaultValue: 0.002,
        section: 'dynamics',
        description: 'Rate at which urbanization crawls upward.'
      },
      {
        key: 'trustReversionRate',
        label: 'Trust Reversion Rate',
        min: 0,
        max: 0.2,
        step: 0.01,
        defaultValue: 0.02,
        section: 'dynamics',
        description: 'How fast social trust returns toward baseline.'
      },
      {
        key: 'demoShockSensitivity',
        label: 'Demographic Shock Sensitivity',
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        section: 'shocks',
        description: 'Impact of shocks (pandemics, conflicts) on demographics.'
      },
      {
        key: 'inequalityDrift',
        label: 'Inequality Drift',
        min: 0,
        max: 0.02,
        step: 0.001,
        defaultValue: 0.005,
        section: 'dynamics',
        description: 'Slow drift in inequality index over time.'
      },
      {
        key: 'diversityDrift',
        label: 'Diversity Drift',
        min: 0,
        max: 0.02,
        step: 0.001,
        defaultValue: 0.002,
        section: 'dynamics',
        description: 'Slow drift in diversity index over time.'
      },
      {
        key: 'randomNoise',
        label: 'Population Noise',
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.01,
        section: 'noise',
        description: 'Random jitter on migration and rates.'
      }
    ]
  }
};


const SystemsSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [original, setOriginal] = useState<SystemSettings | null>(null);
  const [activeSystem, setActiveSystem] = useState<SystemKey>('economic');
  const [activeSection, setActiveSection] = useState<SectionKey>('shocks');
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* ---------- responsive ---------- */

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* ---------- load ---------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/settings/systems`);
        const data = (await res.json()) as Partial<SystemSettings> | null;
        const effective = withSystemDefaults(data);
        if (!cancelled) {
          setSettings(effective);
          setOriginal(effective);
        }
      } catch {
        const fallback = withSystemDefaults(null);
        if (!cancelled) {
          setSettings(fallback);
          setOriginal(fallback);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- derived ---------- */

  const isDirty = useMemo(() => {
    if (!settings || !original) return false;
    return JSON.stringify(settings) !== JSON.stringify(original);
  }, [settings, original]);

  if (!settings) {
    return <div className="p-6 text-sm text-gray-400">Loading…</div>;
  }

  const config = SYSTEM_CONFIGS[activeSystem];
  const values = settings[activeSystem];
  const fields = config.fields.filter(
    (f) => f.section === activeSection
  );

  /* ---------- handlers ---------- */

  const updateField = (key: string, value: number) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            [activeSystem]: {
              ...prev[activeSystem],
              [key]: value
            }
          }
        : prev
    );
  };

  const resetField = (key: string) => {
    const def = DEFAULT_SYSTEMS[activeSystem][key];
    if (typeof def === 'number') updateField(key, def);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/systems`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!res.ok) throw new Error('Save failed');

      const saved = (await res.json()) as Partial<SystemSettings> | null;
      const effective = withSystemDefaults(saved);
      setSettings(effective);
      setOriginal(effective);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- layout ---------- */

  return (
    <div className="flex h-full">
      {/* DESKTOP LEFT RAIL */}
      {!isMobile && (
        <aside className="w-64 border-r border-gray-800 px-4 py-4 space-y-6">
          <div>
            <h1 className="text-sm font-semibold text-gray-100">
              System Settings
            </h1>
            <p className="text-xs text-gray-500">Macro controls</p>
          </div>

          <div className="space-y-1">
            {(Object.keys(SYSTEM_CONFIGS) as SystemKey[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setActiveSystem(key);
                  setActiveSection('shocks');
                }}
                className={[
                  'w-full text-left px-3 py-1.5 rounded text-xs transition',
                  key === activeSystem
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                ].join(' ')}
              >
                {SYSTEM_CONFIGS[key].label.replace(' System', '')}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-800 space-y-1">
            {(['shocks', 'dynamics', 'structure', 'noise'] as SectionKey[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  className={[
                    'w-full text-left px-3 py-1.5 rounded text-xs capitalize transition',
                    s === activeSection
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  ].join(' ')}
                >
                  {s}
                </button>
              )
            )}
          </div>
        </aside>
      )}

      {/* MAIN */}
      <main className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* MOBILE SELECTORS */}
          {isMobile && (
            <>
              <select
                value={activeSystem}
                onChange={(e) => {
                  setActiveSystem(e.target.value as SystemKey);
                  setActiveSection('shocks');
                }}
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm"
              >
                {(Object.keys(SYSTEM_CONFIGS) as SystemKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SYSTEM_CONFIGS[key].label}
                  </option>
                ))}
              </select>

              <select
                value={activeSection}
                onChange={(e) =>
                  setActiveSection(e.target.value as SectionKey)
                }
                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm capitalize"
              >
                {(['shocks', 'dynamics', 'structure', 'noise'] as SectionKey[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            </>
          )}

          <h2 className="text-sm font-semibold text-gray-100 capitalize">
            {activeSection}
          </h2>
          <p className="text-xs text-gray-500">{config.description}</p>

          <div className="rounded-lg border border-gray-800 bg-black/40 p-5 space-y-6">
            {fields.map((field) => (
              <SliderRow
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={updateField}
                onReset={resetField}
              />
            ))}
          </div>
        </div>
      </main>

      {/* SAVE BAR */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-black/80 backdrop-blur px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">Unsaved changes</span>

          <div className="flex gap-3">
            <button
              onClick={() => setSettings(original)}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Discard
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded bg-emerald-500 text-black font-medium hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- slider ---------------- */

interface SliderRowProps {
  field: FieldConfig;
  value: number;
  onChange: (key: string, value: number) => void;
  onReset: (key: string) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  field,
  value,
  onChange,
  onReset
}) => {
  const { key, label, description, min, max, step, defaultValue } =
    field;
  const isDefault = Math.abs(value - defaultValue) < step / 2;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <div>
          <div className="text-xs text-gray-200">{label}</div>
          <div className="text-[11px] text-gray-500">{description}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-gray-400">
            {value.toFixed(4)}
          </span>
          {!isDefault && (
            <button
              onClick={() => onReset(key)}
              className="text-[10px] text-gray-500 hover:text-gray-300"
            >
              reset
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[420px]">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) =>
            onChange(key, Number(e.target.value))
          }
          className="w-full range-slider"
        />
      </div>
    </div>
  );
};

export default SystemsSettingsPage;