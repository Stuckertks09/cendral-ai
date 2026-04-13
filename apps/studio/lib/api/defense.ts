export type DefenseTopic = {
  key: string;
  label: string;
  stance: number;
  certainty: number;
  volatility: number;
  category?: string;
  tags?: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

export async function getDefenseTopics(): Promise<DefenseTopic[]> {
  const res = await fetch(`${API_BASE}/defense/topics`);
  return res.json();
}

export async function updateDefenseTopics(payload: { topics: DefenseTopic[] }) {
  const res = await fetch(`${API_BASE}/defense/topics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
