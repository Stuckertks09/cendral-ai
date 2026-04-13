"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

type PersonaSummary = {
  _id: string;
  identity?: {
    name?: string;
  };
};

export default function PersonasPage() {
  const [items, setItems] = useState<PersonaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/api/core-assets?type=persona`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        // Core-assets list endpoint returns a raw array
        if (!Array.isArray(data)) {
          console.error("Unexpected personas payload:", data);
          setItems([]);
        } else {
          setItems(data);
        }
      } catch (err) {
        console.error("Failed to load personas", err);
        setError("Failed to load personas");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading personas…</div>;
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
      <h2 className="text-2xl font-semibold mb-4">Personas</h2>

      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p._id}>
            <Link
              href={`/assets/personas/${p._id}`}
              className="block p-3 rounded border border-gray-800 hover:bg-gray-900"
            >
              {p.identity?.name || p._id}
            </Link>
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <div className="text-sm text-gray-500 mt-4">
          No personas found.
        </div>
      )}
    </div>
  );
}
