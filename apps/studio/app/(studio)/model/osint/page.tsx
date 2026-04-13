'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RawSignal, SeverityPreview } from '@/types/osint';
import { SeverityPreviewCard } from '@/components/events/SeverityPreviewCard';
import OsintAdhocIngest from '@/components/osint/OsintAdhocIngest';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';


const OsintInboxPage: React.FC = () => {
  const [signals, setSignals] = useState<RawSignal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [minRelevance, setMinRelevance] = useState(0.65);
  const [loading, setLoading] = useState(false);

  // promote flow
  const [, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<SeverityPreview | null>(null);
  const [previewSignal, setPreviewSignal] = useState<RawSignal | null>(null);

  /* ---------- load inbox ---------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/osint/inbox?minRelevance=${minRelevance}`
        );
        const data = await res.json();
        if (!cancelled) setSignals(data.signals || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [minRelevance]);

  const selected = useMemo(
    () => signals.find((s) => s._id === selectedId) ?? null,
    [signals, selectedId]
  );

  /* ---------- actions ---------- */

  const dismiss = async (signal: RawSignal) => {
    await fetch(`${API_BASE}/api/osint/signals/${signal._id}/dismiss`, {
      method: 'POST'
    });

    setSignals((prev) => prev.filter((s) => s._id !== signal._id));
    setSelectedId(null);
  };

  const startPreview = async (signal: RawSignal) => {
    setPreviewing(true);
    setPreview(null);
    setPreviewSignal(signal);

    try {
      const payload = {
        type: signal.llmMeta.event_type || 'unspecified',
        domain: 'defense',
        topic: signal.llmMeta.topics?.[0] || null,
        actor: signal.llmMeta.actors?.[0] || null,
        theater: signal.llmMeta.location || null,
        rawText: `${signal.headline}\n\n${signal.llmMeta.one_sentence_brief}`,
        parsed: signal.llmMeta,
        source: signal.source,
        tags: ['osint']
      };

      const res = await fetch(
        `${API_BASE}/api/events/preview-severity`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) throw new Error('Preview failed');

      const data = await res.json();
      setPreview({
  severity: data.analysis.severity
});
    } finally {
      setPreviewing(false);
    }
  };

  const confirmPromote = async () => {
    if (!previewSignal) return;

    const payload = {
      type: previewSignal.llmMeta.event_type || 'unspecified',
      domain: 'defense',
      topic: previewSignal.llmMeta.topics?.[0] || null,
      actor: previewSignal.llmMeta.actors?.[0] || null,
      theater: previewSignal.llmMeta.location || null,
      rawText: `${previewSignal.headline}\n\n${previewSignal.llmMeta.one_sentence_brief}`,
      parsed: previewSignal.llmMeta,
      source: previewSignal.source,
      tags: ['osint']
    };

    const res = await fetch(`${API_BASE}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return;

    setSignals((prev) =>
      prev.filter((s) => s._id !== previewSignal._id)
    );
    setSelectedId(null);
    setPreview(null);
    setPreviewSignal(null);
  };

  /* ---------- layout ---------- */

  return (
    <div className="flex h-full">
      {/* LEFT RAIL */}
      <aside className="w-64 border-r border-gray-800 px-4 py-4 space-y-6">
        <div>
          <h1 className="text-sm font-semibold text-gray-100">
            OSINT Inbox
          </h1>
          <p className="text-xs text-gray-500">
            Candidate signals
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-gray-400">
            Min relevance
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={minRelevance}
            onChange={(e) =>
              setMinRelevance(Number(e.target.value))
            }
            className="w-full range-slider"
          />
          <div className="text-[11px] font-mono text-gray-500">
            {minRelevance.toFixed(2)}
          </div>
        </div>
      </aside>

      {/* MAIN LIST */}
      <main className="flex-1 overflow-auto px-6 py-6">
  <div className="max-w-xl mx-auto space-y-4">
    <OsintAdhocIngest
      minRelevance={minRelevance}
      onIngestComplete={(signals) => setSignals(signals)}
    />
          {loading && (
            <div className="text-xs text-gray-500">Loading…</div>
          )}

          {signals.map((s) => (
            <button
              key={s._id}
              onClick={() => setSelectedId(s._id)}
              className={[
                'w-full text-left rounded border px-4 py-3 transition',
                selectedId === s._id
                  ? 'border-gray-600 bg-gray-900/40'
                  : 'border-gray-800 hover:border-gray-700'
              ].join(' ')}
            >
              <div className="flex justify-between items-baseline">
                <div className="text-sm text-gray-100">
                  {s.headline}
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  {s.relevanceScore.toFixed(2)}
                </span>
              </div>

              <div className="text-[11px] text-gray-500 mt-1">
                {s.author} •{' '}
                {new Date(s.publishedAt).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* DETAIL PANEL */}
      <aside className="w-[420px] border-l border-gray-800 px-6 py-6 space-y-6">
        {!selected && (
          <div className="text-xs text-gray-500">
            Select a signal to review
          </div>
        )}

        {selected && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-gray-100">
                {selected.headline}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {selected.llmMeta.one_sentence_brief}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <DetailRow label="Actors" value={selected.llmMeta.actors.join(', ')} />
              <DetailRow label="Location" value={selected.llmMeta.location} />
              <DetailRow label="Event Type" value={selected.llmMeta.event_type} />
              <DetailRow label="Topics" value={selected.llmMeta.topics.join(', ')} />
            </div>

            <div className="pt-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => startPreview(selected)}
                className="text-xs px-3 py-1.5 rounded bg-emerald-500 text-black font-medium hover:bg-emerald-400"
              >
                Promote
              </button>

              <button
                onClick={() => dismiss(selected)}
                className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Dismiss
              </button>
            </div>
          </>
        )}
      </aside>

     {/* PREVIEW MODAL */}
{preview && preview?.severity && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div className="w-full max-w-lg rounded-lg border border-gray-800 bg-black p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h3 className="text-sm font-semibold text-gray-100">
          Preview Event Severity
        </h3>
        <p className="text-xs text-gray-500">
          Review modeled impact before promoting to an event
        </p>
      </div>

      {/* SEVERITY CARD */}
      <SeverityPreviewCard
        severity={preview.severity}
      />

      {/* ACTIONS */}
      <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
        <button
          onClick={() => {
            setPreview(null);
            setPreviewSignal(null);
          }}
          className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Cancel
        </button>

        <button
          onClick={confirmPromote}
          className="text-xs px-3 py-1.5 rounded bg-emerald-500 text-black font-medium hover:bg-emerald-400"
        >
          Confirm Promote
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

/* ---------- helpers ---------- */

const DetailRow: React.FC<{
  label: string;
  value?: string | null;
}> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <div className="w-20 text-gray-500">{label}</div>
      <div className="text-gray-300">{value}</div>
    </div>
  );
};

export default OsintInboxPage;
