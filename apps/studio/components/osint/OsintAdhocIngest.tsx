'use client';

import React, { useState } from 'react';
import { RawSignal } from '@/types/osint';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

interface OsintAdhocIngestProps {
  minRelevance: number;
  onIngestComplete: (signals: RawSignal[]) => void;
}

type OsintSource = 'newsapi' | 'twitter';

const OsintAdhocIngest: React.FC<OsintAdhocIngestProps> = ({
  minRelevance,
  onIngestComplete
}) => {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<OsintSource>('newsapi');
  const [ingesting, setIngesting] = useState(false);

  const ingest = async (): Promise<void> => {
    if (ingesting || !query.trim()) return;

    setIngesting(true);
    try {
      // 1. Create ONE-SHOT ad-hoc feed
      await fetch(`${API_BASE}/api/osint/feeds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          name: `Ad-hoc: ${query.slice(0, 40)}`,
          query,
          maxPerRun: 5,
          enabled: true,
          adhoc: true,              // 👈 CRITICAL
          domain: 'defense',
          tags: ['adhoc']
        })
      });

      // 2. Run ingestion once
      await fetch(`${API_BASE}/api/osint/ingest`, {
        method: 'POST'
      });

      // 3. Reload inbox
      const res = await fetch(
        `${API_BASE}/api/osint/inbox?minRelevance=${minRelevance}`
      );

      const data: { signals: RawSignal[] } = await res.json();
      onIngestComplete(data.signals ?? []);
      setQuery('');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="rounded border border-gray-800 bg-black/40 p-4 space-y-3">
      <div className="text-xs font-semibold text-gray-300">
        Ad-hoc OSINT Search
      </div>

      <div className="flex gap-2">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as OsintSource)}
          className="bg-black border border-gray-700 rounded px-2 py-1 text-xs"
        >
          <option value="newsapi">News</option>
          <option value="twitter">Twitter</option>
        </select>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. (Russian AND (military OR incursion))"
          className="flex-1 bg-black border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600"
        />

        <button
          onClick={ingest}
          disabled={ingesting || !query.trim()}
          className="text-xs px-3 py-1.5 rounded bg-emerald-500 text-black font-medium hover:bg-emerald-400 disabled:opacity-60"
        >
          {ingesting ? 'Ingesting…' : 'Ingest'}
        </button>
      </div>
    </div>
  );
};

export default OsintAdhocIngest;
