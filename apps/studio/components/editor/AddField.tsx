// components/editor/AddField.tsx
"use client";

import { useState } from "react";
import { EditorValue } from "@/types/editor";

type Props = {
  onAdd: (key: string, value: EditorValue) => void;
};

export function AddField({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  if (!open) {
    return (
      <button
        className="text-xs text-blue-400"
        onClick={() => setOpen(true)}
      >
        + Add field
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        placeholder="Field name"
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <input
        placeholder="Value"
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        className="text-xs text-green-400"
        onClick={() => {
          if (!key) return;
          onAdd(key, value);
          setKey("");
          setValue("");
          setOpen(false);
        }}
      >
        Save
      </button>
    </div>
  );
}
