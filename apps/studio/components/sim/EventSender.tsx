// apps/studio/components/sim/EventSender.tsx
"use client";

import { useState } from "react";
import { sendEvent } from "@/lib/api/events";

interface Props {
  onSend: () => void;
}

const EVENT_TYPES = [
  "media_event",
  "inflation_shock",
  "natural_disaster",
  "disinfo_campaign",
  "migration_event",
  "pandemic_event",
];

export default function EventSender({ onSend }: Props) {
  const [type, setType] = useState<string>("media_event");
  const [magnitude, setMagnitude] = useState<number>(0.2);
  const [topic, setTopic] = useState<string>("");

  const handleSend = async () => {
    await sendEvent({ type, magnitude, topic: topic || undefined });
    onSend();
  };

  return (
    <div className="p-4 bg-neutral-900 rounded-xl shadow">
      <h2 className="text-lg font-bold mb-3">Inject Event</h2>

      <label className="block text-sm mb-1">Event Type</label>
      <select
        className="w-full p-2 mb-3 bg-neutral-800 rounded-md text-sm"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        {EVENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <label className="block text-sm mb-1">Magnitude</label>
      <input
        type="number"
        min={0}
        max={2}
        step={0.1}
        className="w-full p-2 mb-3 bg-neutral-800 rounded-md text-sm"
        value={magnitude}
        onChange={(e) => setMagnitude(parseFloat(e.target.value || "0"))}
      />

      <label className="block text-sm mb-1">Topic (optional)</label>
      <input
        type="text"
        className="w-full p-2 mb-4 bg-neutral-800 rounded-md text-sm"
        placeholder="elections, climate, economy..."
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

      <button
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-semibold"
        onClick={handleSend}
      >
        🚀 Send Event
      </button>
    </div>
  );
}
