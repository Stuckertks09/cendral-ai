// apps/studio/components/sim/PersonaViewer.tsx
"use client";

import type { WorldState, PersonaSnapshot } from "@/types/simulation";

interface Props {
  worldState: WorldState | null;
}

export default function PersonaViewer({ worldState }: Props) {
  const snapshots: PersonaSnapshot[] = worldState?.personaSnapshots || [];

  return (
    <div className="p-4 bg-neutral-900 rounded-xl shadow max-h-80 overflow-auto">
      <h2 className="text-lg font-bold mb-3">Persona Snapshots</h2>

      {snapshots.length === 0 ? (
        <p className="text-xs text-neutral-400">No persona snapshots recorded.</p>
      ) : (
        snapshots.map((p, idx) => (
          <div
            key={`${p.personaId}-${idx}`}
            className="mb-2 p-2 bg-neutral-800 rounded-md"
          >
            <div className="text-xs font-semibold">{p.personaId}</div>
            {p.summary && (
              <p className="text-xs text-neutral-300">{p.summary}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
