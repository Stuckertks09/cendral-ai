// apps/studio/lib/api/world.ts

import type { WorldState } from "@/types/simulation";

export const fetchWorldHistory = async (): Promise<WorldState[]> => {
  const res = await fetch("/api/world", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch world history");
  }

  return res.json() as Promise<WorldState[]>;
};
