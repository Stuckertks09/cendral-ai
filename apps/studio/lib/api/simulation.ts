// apps/studio/lib/api/simulation.ts

import type { WorldState } from "@/types/simulation";

export const runStep = async (): Promise<void> => {
  const res = await fetch("/api/sim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "step" }),
  });

  if (!res.ok) {
    throw new Error("Failed to run simulation step");
  }
};

export const resetSimulation = async (): Promise<void> => {
  const res = await fetch("/api/sim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset" }),
  });

  if (!res.ok) {
    throw new Error("Failed to reset simulation");
  }
};

export const getWorldState = async (): Promise<WorldState | null> => {
  const res = await fetch("/api/sim", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch world state");
  }

  const data = (await res.json()) as WorldState | null;
  return data;
};
