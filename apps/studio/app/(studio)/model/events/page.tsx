'use client';

import React, { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

type EventParsed = {
  summary?: string;
  sentiment?: number; // -1..1
  keywords?: string[];
  entities?: string[];
};

type SeverityInputs = {
  impactMagnitude?: number; // 0..1
  scope?: number; // 0..1
  immediacy?: number; // 0..1
  reversibility?: number; // 0..1 (1 = fully reversible)
  novelty?: number; // 0..1
  escalationFactor?: number; // -1..1
};

type SeverityAnalysis = {
  magnitude?: number; // 0..1
  direction?: 'escalatory' | 'deescalatory' | 'neutral' | string;
  inputs?: SeverityInputs;
  sentiment?: number; // -1..1
  modelVersion?: string;
  computedAt?: string;

  // optional traces from backend
  ruleBasedSeverity?: number;
  llmSeverity?: number;
  llmWeight?: number;
  ruleWeight?: number;
  noveltyScore?: number;
};

type EventAnalysis = {
  severity?: SeverityAnalysis;
};

type EventSource = {
  origin?: string;
  url?: string;
  author?: string;
  externalId?: string;
};

type EventDoc = {
  _id: string;
  type: string;
  domain: string;
  topic?: string;
  actor?: string;
  target?: string;
  theater?: string;
  subTheater?: string;
  severity?: number;
  category?: string;
  rawText: string;
  parsed?: EventParsed;
  source?: EventSource;
  timestamp?: string;
  tags?: string[];
  analysis?: EventAnalysis;
};

type DomainFilter = 'all' | 'defense' | 'political' | 'economic' | 'enterprise' | 'general';

type WhatIfInputs = {
  impactMagnitude: number;
  scope: number;
  immediacy: number;
  reversibility: number;
  novelty: number;
  escalationFactor: number;
  sentiment: number;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clampSigned = (v: number) => Math.max(-1, Math.min(1, v));

function computeWhatIfSeverity(inputs: WhatIfInputs): number {
  const {
    impactMagnitude,
    scope,
    immediacy,
    reversibility,
    novelty,
    escalationFactor,
    sentiment,
  } = inputs;

  // Simple, neutral weighting model – doesn’t need to be identical to backend,
  // just internally consistent and interpretable.
  const base =
    0.35 * impactMagnitude +
    0.15 * scope +
    0.2 * immediacy +
    0.1 * (1 - reversibility) + // irreversible events nudge severity up
    0.1 * novelty +
    0.1 * (0.5 + 0.5 * (escalationFactor ?? 0)); // -1..1 => 0..1

  const sentimentAdj = 0.05 * sentiment; // small tilt based on sentiment

  return clamp01(base + sentimentAdj);
}

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityMin, setSeverityMin] = useState(0);
  const [severityMax, setSeverityMax] = useState(1);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // run-step panel
  const [runIdInput, setRunIdInput] = useState('');
  const [runResult, setRunResult] = useState<string | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // tuning panel state
  const [tuningInputs, setTuningInputs] = useState<WhatIfInputs | null>(null);

  // Fetch events whenever domainFilter or search changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', '200');
        if (domainFilter !== 'all') params.set('domain', domainFilter);
        if (search.trim().length > 0) params.set('search', search.trim());
        if (typeFilter !== 'all') params.set('type', typeFilter);

        const res = await fetch(`${API_BASE}/api/events?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to load events: ${res.status}`);
        }
        const json = (await res.json()) as EventDoc[];
        if (!cancelled) {
          setEvents(json);
          if (!selectedEventId && json.length > 0) {
            setSelectedEventId(json[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load events.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [domainFilter, search, typeFilter, selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((e) => e._id === selectedEventId) || null,
    [events, selectedEventId],
  );

  // Initialize tuning inputs whenever selected event changes
  useEffect(() => {
    if (!selectedEvent) {
      setTuningInputs(null);
      return;
    }

    const sev = selectedEvent.analysis?.severity;
    const inp = sev?.inputs || {};

    const sentiment =
      typeof sev?.sentiment === 'number'
        ? clampSigned(sev.sentiment)
        : typeof selectedEvent.parsed?.sentiment === 'number'
        ? clampSigned(selectedEvent.parsed.sentiment)
        : 0;

    setTuningInputs({
      impactMagnitude: inp.impactMagnitude ?? 0.5,
      scope: inp.scope ?? 0.5,
      immediacy: inp.immediacy ?? 0.5,
      reversibility: inp.reversibility ?? 0.5,
      novelty: inp.novelty ?? 0.5,
      escalationFactor: inp.escalationFactor ?? 0,
      sentiment,
    });
  }, [selectedEvent]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const s = typeof e.severity === 'number' ? e.severity : 0.5;
      return s >= severityMin && s <= severityMax;
    });
  }, [events, severityMin, severityMax]);

  const distinctTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.type) set.add(e.type);
    });
    return Array.from(set).sort();
  }, [events]);

  const whatIfSeverity = useMemo(() => {
    if (!tuningInputs) return null;
    return computeWhatIfSeverity(tuningInputs);
  }, [tuningInputs]);

  const handleRunStep = async () => {
    if (!selectedEvent) return;
    setRunLoading(true);
    setRunError(null);
    setRunResult(null);
    try {
      const payload: { eventId: string; runId?: string; sliders?: unknown } = {
        eventId: selectedEvent._id,
      };
      if (runIdInput.trim()) {
        payload.runId = runIdInput.trim();
      }

      const res = await fetch(`${API_BASE}/api/cognition/run-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();

      if (!res.ok) {
        const msg = body?.error || `Failed with ${res.status}`;
        throw new Error(msg);
      }

      const newRunId =
        body.worldState?.runId || body.worldState?._id || 'ok';
      setRunResult(
        `Step executed. RunId: ${newRunId.toString?.() ?? String(newRunId)}`,
      );
    } catch (err) {
      console.error('run-step error', err);
      const msg = err instanceof Error ? err.message : 'Failed to run step';
      setRunError(msg);
    } finally {
      setRunLoading(false);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300">
        Loading events…
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="p-6 text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* LEFT: Event Library */}
      <aside className="w-80 border-r border-gray-800 p-4 flex flex-col gap-4">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white">
            Event Library
          </h1>
          <p className="text-[11px] text-gray-400 mt-1">
            Ingested events with neutral severity analysis.
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-2 text-xs">
          <label className="block">
            <span className="text-[11px] text-gray-400">Domain</span>
            <select
              className="mt-1 w-full rounded-md bg-black/40 border border-gray-800 px-2 py-1 text-xs text-white"
              value={domainFilter}
              onChange={(e) =>
                setDomainFilter(e.target.value as DomainFilter)
              }
            >
              <option value="all">All domains</option>
              <option value="defense">Defense</option>
              <option value="political">Political</option>
              <option value="economic">Economic</option>
              <option value="enterprise">Enterprise</option>
              <option value="general">General</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] text-gray-400">Type</span>
            <select
              className="mt-1 w-full rounded-md bg-black/40 border border-gray-800 px-2 py-1 text-xs text-white"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All types</option>
              {distinctTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] text-gray-400">Search</span>
            <input
              className="mt-1 w-full rounded-md bg-black/40 border border-gray-800 px-2 py-1 text-xs text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search text or summary"
            />
          </label>

          {/* Severity range */}
          <div className="space-y-1">
            <span className="text-[11px] text-gray-400">
              Severity range
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">
                {severityMin.toFixed(2)}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={severityMin}
                onChange={(e) =>
                  setSeverityMin(
                    Math.min(
                      parseFloat(e.target.value),
                      severityMax,
                    ),
                  )
                }
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">
                {severityMax.toFixed(2)}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={severityMax}
                onChange={(e) =>
                  setSeverityMax(
                    Math.max(
                      parseFloat(e.target.value),
                      severityMin,
                    ),
                  )
                }
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Event list */}
        <div className="flex-1 overflow-auto mt-2 space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="text-[11px] text-gray-500">
              No events match current filters.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isActive = ev._id === selectedEventId;
              const summary =
                ev.parsed?.summary ||
                ev.rawText?.slice(0, 120) ||
                '(no text)';
              const sev =
                typeof ev.severity === 'number'
                  ? ev.severity.toFixed(2)
                  : '—';
              const ts = ev.timestamp
                ? new Date(ev.timestamp).toLocaleString()
                : '—';

              return (
                <button
                  key={ev._id}
                  type="button"
                  onClick={() => setSelectedEventId(ev._id)}
                  className={
                    'w-full text-left rounded-lg border px-3 py-2 text-xs mb-1 ' +
                    (isActive
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-gray-800 bg-black/40 text-gray-200 hover:bg-gray-900')
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">
                      {ev.type || 'Event'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Sev: {sev}
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400 line-clamp-2">
                    {summary}
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                    <span>{ev.domain}</span>
                    <span>{ts}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT: Detail + Tuning */}
      <main className="flex-1 flex flex-col px-6 py-4 gap-4 overflow-auto">
        {!selectedEvent ? (
          <div className="text-sm text-gray-400">
            Select an event to inspect.
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  {selectedEvent.type || 'Event'} ·{' '}
                  <span className="text-gray-400">
                    {selectedEvent.domain}
                  </span>
                </h2>
                <p className="text-[11px] text-gray-400 mt-1 max-w-2xl">
                  {selectedEvent.parsed?.summary ||
                    selectedEvent.rawText}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray-500">
                  {selectedEvent.topic && (
                    <span className="px-2 py-0.5 rounded-full border border-gray-700">
                      Topic: {selectedEvent.topic}
                    </span>
                  )}
                  {selectedEvent.actor && (
                    <span className="px-2 py-0.5 rounded-full border border-gray-700">
                      Actor: {selectedEvent.actor}
                    </span>
                  )}
                  {selectedEvent.target && (
                    <span className="px-2 py-0.5 rounded-full border border-gray-700">
                      Target: {selectedEvent.target}
                    </span>
                  )}
                  {selectedEvent.theater && (
                    <span className="px-2 py-0.5 rounded-full border border-gray-700">
                      Theater: {selectedEvent.theater}
                    </span>
                  )}
                  {selectedEvent.tags?.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full border border-gray-800"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs text-right">
                <div className="border border-gray-800 rounded-xl bg-black/40 px-3 py-2 inline-block">
                  <div className="text-[10px] text-gray-500">
                    Severity
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {typeof selectedEvent.severity === 'number'
                      ? selectedEvent.severity.toFixed(3)
                      : '—'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {selectedEvent.analysis?.severity?.direction ||
                      'unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* LAYOUT: left (decomposition) / right (tuning + run) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Severity Decomposition */}
              <div className="border border-gray-800 rounded-xl bg-black/40 px-4 py-3 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] text-gray-300">
                    Severity Decomposition
                  </h3>
                  <span className="text-[10px] text-gray-500">
                    {selectedEvent.analysis?.severity?.modelVersion ||
                      'model: severity-v1'}
                  </span>
                </div>

                {selectedEvent.analysis?.severity ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-gray-500">
                          Final magnitude
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {typeof selectedEvent.analysis.severity
                            .magnitude === 'number'
                            ? selectedEvent.analysis.severity.magnitude.toFixed(
                                3,
                              )
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500">
                          Sentiment
                        </div>
                        <div className="text-sm text-gray-200">
                          {typeof selectedEvent.analysis.severity
                            .sentiment === 'number'
                            ? selectedEvent.analysis.severity.sentiment.toFixed(
                                2,
                              )
                            : '—'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <MetricRow
                        label="Impact magnitude"
                        value={
                          selectedEvent.analysis.severity.inputs
                            ?.impactMagnitude
                        }
                      />
                      <MetricRow
                        label="Scope"
                        value={
                          selectedEvent.analysis.severity.inputs?.scope
                        }
                      />
                      <MetricRow
                        label="Immediacy"
                        value={
                          selectedEvent.analysis.severity.inputs
                            ?.immediacy
                        }
                      />
                      <MetricRow
                        label="Reversibility"
                        value={
                          selectedEvent.analysis.severity.inputs
                            ?.reversibility
                        }
                      />
                      <MetricRow
                        label="Novelty"
                        value={
                          selectedEvent.analysis.severity.inputs?.novelty
                        }
                      />
                      <MetricRow
                        label="Escalation factor"
                        value={
                          selectedEvent.analysis.severity.inputs
                            ?.escalationFactor
                        }
                      />
                    </div>

                    <div className="mt-3 border-t border-gray-800 pt-2 text-[10px] text-gray-500 grid grid-cols-2 gap-3">
                      <div>
                        <div>Rule-based</div>
                        <div className="text-gray-300">
                          {typeof selectedEvent.analysis.severity
                            .ruleBasedSeverity === 'number'
                            ? selectedEvent.analysis.severity.ruleBasedSeverity.toFixed(
                                3,
                              )
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div>LLM severity</div>
                        <div className="text-gray-300">
                          {typeof selectedEvent.analysis.severity
                            .llmSeverity === 'number'
                            ? selectedEvent.analysis.severity.llmSeverity.toFixed(
                                3,
                              )
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div>Rule weight</div>
                        <div className="text-gray-300">
                          {typeof selectedEvent.analysis.severity
                            .ruleWeight === 'number'
                            ? selectedEvent.analysis.severity.ruleWeight.toFixed(
                                2,
                              )
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div>LLM weight</div>
                        <div className="text-gray-300">
                          {typeof selectedEvent.analysis.severity
                            .llmWeight === 'number'
                            ? selectedEvent.analysis.severity.llmWeight.toFixed(
                                2,
                              )
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-gray-500">
                    No severity analysis attached to this event yet.
                  </div>
                )}
              </div>

              {/* Tuning + Run */}
              <div className="space-y-4">
                {/* Tuning playground */}
                <div className="border border-gray-800 rounded-xl bg-black/40 px-4 py-3 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] text-gray-300">
                      Severity Tuning Playground
                    </h3>
                    {whatIfSeverity !== null && (
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500">
                          What-if severity
                        </div>
                        <div className="text-lg font-semibold text-white">
                          {whatIfSeverity.toFixed(3)}
                        </div>
                      </div>
                    )}
                  </div>

                  {!tuningInputs ? (
                    <div className="text-[11px] text-gray-500">
                      No analysis inputs available for this event.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <SliderRow
                        label="Impact magnitude"
                        min={0}
                        max={1}
                        step={0.05}
                        value={tuningInputs.impactMagnitude}
                        onChange={(v) =>
                          setTuningInputs((prev) =>
                            prev
                              ? { ...prev, impactMagnitude: v }
                              : prev,
                          )
                        }
                      />
                      <SliderRow
                        label="Scope (local → global)"
                        min={0}
                        max={1}
                        step={0.05}
                        value={tuningInputs.scope}
                        onChange={(v) =>
                          setTuningInputs((prev) =>
                            prev ? { ...prev, scope: v } : prev,
                          )
                        }
                      />
                      <SliderRow
                        label="Immediacy"
                        min={0}
                        max={1}
                        step={0.05}
                        value={tuningInputs.immediacy}
                        onChange={(v) =>
                          setTuningInputs((prev) =>
                            prev
                              ? { ...prev, immediacy: v }
                              : prev,
                          )
                        }
                      />
                      <SliderRow
                        label="Reversibility"
                        min={0}
                        max={1}
                        step={0.05}
                        value={tuningInputs.reversibility}
                        onChange={(v) =>
                          setTuningInputs((prev) =>
                            prev
                              ? { ...prev, reversibility: v }
                              : prev,
                          )
                        }
                      />
                      <SliderRow
                        label="Novelty"
                        min={0}
                        max={1}
                        step={0.05}
                        value={tuningInputs.novelty}
                        onChange={(v) =>
                          setTuningInputs((prev) =>
                            prev ? { ...prev, novelty: v } : prev,
                          )
                        }
                      />
                      <SliderRow
                        label="Escalation factor (-1 = de-escalate, +1 = escalate)"
                        min={-1}
                        max={1}
                        step={0.1}
                        value={tuningInputs.escalationFactor}
                        onChange={(v) =>
                          setTuningInputs((prev) =>
                            prev
                              ? { ...prev, escalationFactor: v }
                              : prev,
                          )
                        }
                      />
                      <SliderRow
                        label="Sentiment (-1..1)"
                        min={-1}
                        max={1}
                        step={0.1}
                        value={tuningInputs.sentiment}
                        onChange={(v) =>
                          setTuningInputs((prev) =>
                            prev ? { ...prev, sentiment: v } : prev,
                          )
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Run-step panel */}
                <div className="border border-gray-800 rounded-xl bg-black/40 px-4 py-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] text-gray-300">
                      Run Single Step
                    </h3>
                    <span className="text-[10px] text-gray-500">
                      /api/cognition/run-step
                    </span>
                  </div>

                  <label className="block">
                    <span className="text-[11px] text-gray-400">
                      Existing runId (optional)
                    </span>
                    <input
                      className="mt-1 w-full rounded-md bg-black/40 border border-gray-800 px-2 py-1 text-xs text-white"
                      placeholder="Leave empty to start a new run"
                      value={runIdInput}
                      onChange={(e) => setRunIdInput(e.target.value)}
                    />
                  </label>

                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handleRunStep}
                      disabled={runLoading}
                      className="px-3 py-1 rounded-md bg-emerald-500 text-black font-medium hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {runLoading ? 'Running…' : 'Run Step'}
                    </button>
                  </div>

                  {runError && (
                    <div className="text-[11px] text-red-400 mt-1">
                      {runError}
                    </div>
                  )}
                  {runResult && (
                    <div className="text-[11px] text-gray-300 mt-1">
                      {runResult}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

interface MetricRowProps {
  label: string;
  value?: number;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value }) => (
  <div>
    <div className="text-[10px] text-gray-500">{label}</div>
    <div className="text-sm text-gray-200">
      {typeof value === 'number' ? value.toFixed(3) : '—'}
    </div>
  </div>
);

interface SliderRowProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
}) => (
  <div>
    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
      <span>{label}</span>
      <span className="text-gray-300">
        {value.toFixed(2)}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full"
    />
  </div>
);

export default EventsPage;
