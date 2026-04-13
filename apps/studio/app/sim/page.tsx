"use client";

import { useEffect, useState } from "react";
import type {
  WorldState,
  DefenseSlice,
  DefenseTheater,
  DefenseMetrics,
  DefenseDebugLayer,
} from "@/types/simulation";

// --------------------------------------------
// Event type
// --------------------------------------------
interface SimEvent {
  _id: string;
  type: string;
  domain: string;
  topic?: string;
  rawText?: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

// =============================================
// MAIN PAGE
// =============================================
export default function SimPage() {
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // --------------------------------------------
  // Load events
  // --------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/events`);
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : data.events ?? []);
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --------------------------------------------
  // Run simulation
  // --------------------------------------------
  async function runSimulation() {
    if (!selectedEventId) return alert("Select an event first.");

    setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/api/cognition/run-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: "defense",
          eventId: selectedEventId,
        }),
      });

      const json = await res.json();
      if (!json.success && !json.ok) throw new Error("Run failed");

      setWorldState(json.worldState);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return <div className="p-10 text-gray-400">Loading…</div>;
  }

  return (
    <div className="p-10 space-y-10">
      {/* HEADER */}
      <header className="space-y-4">
        <h1 className="text-3xl font-bold">Defense Simulation</h1>

        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Scenario Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-gray-900 border border-gray-700 p-2 rounded w-96"
            >
              <option value="">— select event —</option>
              {events.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.type} · {e.topic ?? "no topic"}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={runSimulation}
            disabled={running}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold"
          >
            {running ? "Running…" : "Run Simulation"}
          </button>
        </div>
      </header>

      {/* RESULT */}
      {!worldState ? (
        <div className="text-gray-400 italic">
          Select a scenario and run the simulation.
        </div>
      ) : (
        <SimulationResult
          worldState={worldState}
          showDebug={showDebug}
          onToggleDebug={() => setShowDebug((v) => !v)}
        />
      )}
    </div>
  );
}

// =============================================
// RESULT PANEL
// =============================================
function SimulationResult({
  worldState,
  showDebug,
  onToggleDebug,
}: {
  worldState: WorldState;
  showDebug: boolean;
  onToggleDebug: () => void;
}) {
  const defense = worldState.defense as DefenseSlice | undefined;
  if (!defense) return null;

  return (
    <div className="space-y-10">
      <OutcomePanel metrics={defense.metrics} />

      <details className="bg-gray-900 p-6 rounded border border-gray-700">
        <summary className="cursor-pointer font-semibold text-lg">
          Theater Breakdown
        </summary>
        <div className="mt-6">
          <TheaterList theaters={defense.theaters} />
        </div>
      </details>

      <details className="bg-gray-900 p-6 rounded border border-gray-700">
        <summary className="cursor-pointer font-semibold text-lg">
          Raw World State
        </summary>
        <pre className="mt-4 max-h-[40vh] overflow-auto text-xs text-green-300">
          {JSON.stringify(worldState, null, 2)}
        </pre>
      </details>

      {worldState.debug?.defense && (
        <div>
          <button
            onClick={onToggleDebug}
            className="text-sm text-gray-400 underline"
          >
            {showDebug ? "Hide Debug Output" : "Show Debug Output"}
          </button>

          {showDebug && (
            <pre className="mt-4 bg-black/40 p-4 text-xs text-green-300 rounded max-h-[40vh] overflow-auto">
              {JSON.stringify(
                worldState.debug.defense as DefenseDebugLayer,
                null,
                2
              )}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// OUTCOME PANEL
// =============================================
function OutcomePanel({ metrics }: { metrics: DefenseMetrics }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {Object.entries(metrics).map(([k, v]) => (
        <div
          key={k}
          className="bg-gray-900 border border-gray-700 rounded p-5"
        >
          <div className="text-sm text-gray-400 capitalize">{k}</div>
          <div className="text-3xl font-bold">{v.toFixed(3)}</div>
        </div>
      ))}
    </div>
  );
}

// =============================================
// THEATER LIST
// =============================================
function TheaterList({ theaters }: { theaters: DefenseTheater[] }) {
  return (
    <div className="space-y-4">
      {theaters.map((t) => (
        <div
          key={t.key}
          className="bg-gray-800 border border-gray-700 rounded p-4"
        >
          <div className="font-bold mb-3">
            {t.label} ({t.key})
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <Metric label="Tension" value={t.tension} />
            <Metric label="Stability" value={t.stability} />
            <Metric label="Escalation Risk" value={t.escalationRisk} />
            <Metric label="Conflict Probability" value={t.conflictProbability} />
            <Metric label="Allied Presence" value={t.alliedPresence} />
            <Metric label="Adversary Presence" value={t.adversaryPresence} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-2">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-semibold">{value.toFixed(2)}</div>
    </div>
  );
}
