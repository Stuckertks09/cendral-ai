// apps/studio/components/sim/SettingsPanel.tsx
"use client";

import { useState } from "react";
import { updateSettings } from "@/lib/api/settings";

type EconSettings = {
  inflationSensitivity: number;
  shockAmplification: number;
  marketMomentumWeight: number;
};

const initialEcon: EconSettings = {
  inflationSensitivity: 1,
  shockAmplification: 1,
  marketMomentumWeight: 1,
};

export default function SettingsPanel() {
  const [econ, setEcon] = useState<EconSettings>(initialEcon);
  const [isSaving, setIsSaving] = useState(false);

  const update = async (key: keyof EconSettings, val: number) => {
    const newState = { ...econ, [key]: val };
    setEcon(newState);
    setIsSaving(true);
    try {
      await updateSettings("EconomicSystem", { [key]: val });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 bg-neutral-900 rounded-xl shadow">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Settings</h2>
        {isSaving && <span className="text-xs text-neutral-400">Saving…</span>}
      </div>

      {Object.entries(econ).map(([key, value]) => (
        <div key={key} className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span>{key}</span>
            <span>{value.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={value}
            onChange={(e) => update(key as keyof EconSettings, parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}
