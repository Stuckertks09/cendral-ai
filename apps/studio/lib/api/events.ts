// apps/studio/lib/api/events.ts

export interface SimEvent {
  type: string;
  magnitude?: number;
  topic?: string;
  [key: string]: unknown;
}

export const sendEvent = async (evt: SimEvent): Promise<void> => {
  await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(evt),
  });
};
