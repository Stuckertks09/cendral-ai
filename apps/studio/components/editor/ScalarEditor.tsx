// components/editor/ScalarEditor.tsx
"use client";

import { Scalar } from "@/types/editor";

type Props = {
  value: Scalar;
  readOnly?: boolean;
  onChange: (v: Scalar) => void;
};

export function ScalarEditor({
  value,
  readOnly = false,
  onChange,
}: Props) {
  const baseInputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 " +
    "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

  const readOnlyClass = "text-sm text-slate-900";

  // ---------- Number ----------
  if (typeof value === "number") {
    if (readOnly) {
      return (
        <div className={readOnlyClass}>
          {Number.isFinite(value) ? value : ""}
        </div>
      );
    }

    return (
      <input
        type="number"
        step="0.01"
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? 0 : Number(raw));
        }}
        className={baseInputClass}
      />
    );
  }

  // ---------- Boolean ----------
  if (typeof value === "boolean") {
    if (readOnly) {
      return (
        <div className={readOnlyClass}>
          {value ? "True" : "False"}
        </div>
      );
    }

    return (
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{value ? "True" : "False"}</span>
      </label>
    );
  }

  // ---------- Null ----------
  if (value === null) {
    return (
      <div className="text-sm italic text-slate-400">
        null
      </div>
    );
  }

  // ---------- String ----------
  if (readOnly) {
    return <div className={readOnlyClass}>{value}</div>;
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={baseInputClass}
    />
  );
}
