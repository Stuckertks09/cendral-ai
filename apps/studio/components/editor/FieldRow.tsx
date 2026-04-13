// components/editor/FieldRow.tsx
"use client";

import { useState } from "react";
import { Scalar } from "@/types/editor";
import { ScalarEditor } from "./ScalarEditor";
import { Pencil } from "lucide-react";

type Props = {
  label: string;
  value: Scalar;
  onChange: (v: Scalar) => void;
};

export function FieldRow({ label, value, onChange }: Props) {
  const [editing, setEditing] = useState(false);

  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && Number.isNaN(value));

  return (
    <div className="grid grid-cols-[180px_1fr_32px] items-center px-4 py-2 bg-white hover:bg-slate-50">
      <div className="field-label">{label}</div>

      <div className="field-value">
        {editing ? (
          <ScalarEditor value={value} onChange={onChange} />
        ) : isEmpty ? (
          <span className="field-value-empty">(not specified)</span>
        ) : (
          String(value)
        )}
      </div>

      <button
        type="button"
        className="flex items-center justify-center text-slate-300 hover:text-slate-600"
        onClick={() => setEditing((v) => !v)}
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}
