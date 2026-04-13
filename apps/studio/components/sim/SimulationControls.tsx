// apps/studio/components/sim/SimulationControls.tsx
"use client";

import { runStep, resetSimulation } from "@/lib/api/simulation";

interface Props {
  onStep: () => void;
}

export default function SimulationControls({ onStep }: Props) {
  const handleStep = async () => {
    await runStep();
    onStep();
  };

  const handleReset = async () => {
    await resetSimulation();
    onStep();
  };

  return (
    <div className="p-4 bg-neutral-900 rounded-xl shadow">
      <h2 className="text-lg font-bold mb-3">Simulation Controls</h2>
      <div className="flex gap-3">
        <button
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md text-sm font-semibold"
          onClick={handleStep}
        >
          ▶ Run Step
        </button>
        <button
          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md text-sm font-semibold"
          onClick={handleReset}
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
