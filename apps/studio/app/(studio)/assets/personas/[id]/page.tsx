// app/(studio)/assets/personas/[id]/page.tsx
"use client";

import { useEffect, useRef, useState, use } from "react";
import { ObjectEditor } from "@/components/editor/ObjectEditor";
import { EditorValue, Path } from "@/types/editor";
import { setAtPath } from "@/lib/objectPath";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5002";

export default function PersonaEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [data, setData] = useState<EditorValue | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // snapshot for discard
  const originalRef = useRef<EditorValue | null>(null);

  /* ----------------------------------------
     Load persona
  ---------------------------------------- */
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(
          `${API_BASE}/api/core-assets/persona/${id}`
        );
        const json = (await res.json()) as EditorValue;

        if (!active) return;

        originalRef.current = json;
        setData(json);
        setDirty(false);
      } catch {
        if (active) setError("Failed to load persona");
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  /* ----------------------------------------
     Handlers
  ---------------------------------------- */
  const handleChange = (path: Path, value: EditorValue) => {
    setDirty(true);
    setData((prev) =>
      prev ? setAtPath(prev, path, value) : prev
    );
  };

  const handleDiscard = () => {
    setData(originalRef.current);
    setDirty(false);
  };

  const handleSave = async () => {
    if (!data) return;

    try {
      setSaving(true);
      setError(null);

      await fetch(`${API_BASE}/api/core-assets/persona/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      originalRef.current = data;
      setDirty(false);
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------------------
     Render
  ---------------------------------------- */
  if (!data) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Loading persona…
      </div>
    );
  }

  return (
    <div className="relative max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white-900">
          Persona Editor
        </h1>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Editor */}
      <ObjectEditor
        value={data}
        path={[]}
        onChange={handleChange}
      />

      {/* Save / Discard Bar */}
      {dirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex gap-2 bg-white border border-slate-200 shadow-lg rounded-md p-3">
            <button
              className="px-4 py-2 text-sm rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={handleDiscard}
              disabled={saving}
            >
              Discard
            </button>

            <button
              className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
