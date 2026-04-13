'use client';

import React from 'react';

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

export interface SliderField<K extends string = string> {
  key: K;
  label: string;
  description?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

interface SliderRowProps<K extends string = string> {
  field: SliderField<K>;
  value: number;
  onChange: (key: K, value: number) => void;
  onReset?: (key: K) => void;
  intent?: 'tuning' | 'emphasized';
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export function SliderRow<K extends string>({
  field,
  value,
  onChange,
  onReset,
  intent = 'tuning',
}: SliderRowProps<K>) {
  const { key, label, description, min, max, step, defaultValue } =
    field;

  const isDefault = Math.abs(value - defaultValue) < step / 2;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs text-gray-200">{label}</div>
          {description && (
            <div className="text-[11px] text-gray-500">
              {description}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-gray-400">
            {value.toFixed(4)}
          </span>

          {!isDefault && onReset && (
            <button
              type="button"
              onClick={() => onReset(key)}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition"
            >
              reset
            </button>
          )}
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) =>
          onChange(key, Number(e.target.value))
        }
        className={[
          'w-full range-slider',
          intent === 'emphasized'
            ? 'range-emphasized'
            : 'range-tuning',
        ].join(' ')}
      />
    </div>
  );
}
