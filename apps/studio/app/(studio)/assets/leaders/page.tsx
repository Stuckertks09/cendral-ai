"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

type LeaderSummary = {
  _id: string;
  name?: string;
  identity?: {
    name?: string;
  };
};

export default function LeadersPage() {
  const [items, setItems] = useState<LeaderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/api/core-assets?type=leader`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("Unexpected leaders payload:", data);
          setItems([]);
        } else {
          setItems(data);
        }
      } catch (err) {
        console.error("Failed to load leaders", err);
        setError("Failed to load leaders");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading leaders…</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-400 border border-red-900 bg-red-950/40 rounded p-3">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Leaders</h2>

      <ul className="space-y-2">
        {items.map((l) => (
          <li key={l._id}>
            <Link
              href={`/assets/leaders/${l._id}`}
              className="block p-3 rounded border border-gray-800 hover:bg-gray-900"
            >
              {l.identity?.name || l.name || l._id}
            </Link>
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <div className="text-sm text-gray-500 mt-4">
          No leaders found.
        </div>
      )}
    </div>
  );
}
