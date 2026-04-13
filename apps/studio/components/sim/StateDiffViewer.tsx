// apps/studio/components/sim/StateDiffViewer.tsx
"use client";

import type { WorldState, WorldStateDiff } from "@/types/simulation";

interface Props {
  prev: WorldState | null;
  curr: WorldState | null;
}

export default function StateDiffViewer({ prev, curr }: Props) {
  if (!prev || !curr) return null;

  const diff: WorldStateDiff = {};

  for (const key of Object.keys(curr) as Array<keyof WorldState>) {
    const before = prev[key];
    const after = curr[key];

    // deep compare — JSON stringify is fine for now
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      diff[key] = { before, after };
    }
  }

  const diffKeys = Object.keys(diff);

  return (
    <div className="p-4 bg-neutral-900 rounded-xl shadow max-h-80 overflow-auto">
      <h2 className="text-lg font-bold mb-2">State Diff</h2>

      {diffKeys.length === 0 ? (
        <p className="text-xs text-neutral-400">No changes between last two steps.</p>
      ) : (
        <pre className="text-xs whitespace-pre-wrap leading-snug">
          {JSON.stringify(diff, null, 2)}
        </pre>
      )}
    </div>
  );
}
