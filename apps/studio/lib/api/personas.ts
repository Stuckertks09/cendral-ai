// apps/studio/lib/api/personas.ts

import type { PersonaSummary } from "@/types/simulation";

export const fetchPersonas = async (): Promise<PersonaSummary[]> => {
  const res = await fetch("/api/personas", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch personas");
  }

  const data = (await res.json()) as PersonaSummary[];
  return data;
};
