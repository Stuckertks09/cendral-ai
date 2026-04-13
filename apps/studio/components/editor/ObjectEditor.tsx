// components/editor/ObjectEditor.tsx
"use client";

import { ReactNode } from "react";
import { EditorValue, Path, Scalar } from "@/types/editor";
import { FieldRow } from "./FieldRow";
import { CollapsibleCard } from "./CollapsibleCard";

/* -----------------------------
   Types
----------------------------- */

type Props = {
  value: EditorValue;
  path: Path;
  onChange: (path: Path, value: EditorValue) => void;
};

const isScalar = (v: EditorValue): v is Scalar =>
  typeof v === "string" ||
  typeof v === "number" ||
  typeof v === "boolean" ||
  v === null;

/* -----------------------------
   Group wrapper (CORE / IDENTITY / etc)
----------------------------- */

function GroupBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-slate-400 bg-gray-400">
      {/* dark header bar */}
      <div className="px-4 py-3 border-b border-slate-800 bg-gray-400">
        <h2 className="text-xs font-semibold tracking-[0.12em] text-slate-900/90 uppercase">
          {title}
        </h2>
      </div>

      {/* light content area */}
      <div className="bg-slate-50">{children}</div>
    </section>
  );
}

/* -----------------------------
   Root ObjectEditor
----------------------------- */

export function ObjectEditor({ value, path, onChange }: Props) {
  if (!value || typeof value !== "object") return null;

  // ROOT: split CORE vs rest
  if (path.length === 0) {
    const obj = value as Record<string, EditorValue>;

    const coreKeys = ["_id", "__v", "createdAt", "updatedAt"];

    const coreEntries = Object.entries(obj).filter(([k]) =>
      coreKeys.includes(k)
    ) as [string, Scalar][];

    const otherEntries = Object.entries(obj).filter(
      ([k]) => !coreKeys.includes(k)
    ) as [string, EditorValue][];

    return (
      <div className="space-y-6">
        {/* CORE */}
        {coreEntries.length > 0 && (
          <GroupBlock title="Core">
            {coreEntries.map(([key, v]) => (
              <FieldRow
                key={key}
                label={key}
                value={v}
                onChange={(val) => onChange([key], val)}
              />
            ))}
          </GroupBlock>
        )}

        {/* TOP-LEVEL SECTIONS */}
        {otherEntries.map(([key, v]) => (
          <GroupBlock key={key} title={key}>
            <InnerObject
              value={v}
              path={[key]}
              onChange={onChange}
            />
          </GroupBlock>
        ))}
      </div>
    );
  }

  // non-root
  return <InnerObject value={value} path={path} onChange={onChange} />;
}

/* -----------------------------
   Recursive inner renderer
----------------------------- */

function InnerObject({
  value,
  path,
  onChange,
}: {
  value: EditorValue;
  path: Path;
  onChange: (path: Path, value: EditorValue) => void;
}) {
  if (!value || typeof value !== "object") return null;

  const obj = value as Record<string, EditorValue>;

  return (
    <div className="divide-y divide-slate-100">
      {Object.entries(obj).map(([key, v]) => {
        const nextPath: Path = [...path, key];

        // SCALAR FIELD
        if (isScalar(v)) {
          return (
            <FieldRow
              key={key}
              label={key}
              value={v}
              onChange={(val) => onChange(nextPath, val)}
            />
          );
        }

        // NESTED OBJECT / ARRAY
        return (
          <div key={key} className="px-4 py-3">
            <CollapsibleCard title={key}>
              <InnerObject
                value={v}
                path={nextPath}
                onChange={onChange}
              />
            </CollapsibleCard>
          </div>
        );
      })}
    </div>
  );
}
