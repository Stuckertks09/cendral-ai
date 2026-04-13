// components/editor/CollapsibleSection.tsx
"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

type Props = {
  title: string;
  children: ReactNode;
};

export function CollapsibleSection({ title, children }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
        <span className="section-header m-0 border-0 p-0">
          {/* reset margin/border because we control them in the container */}
          {title}
        </span>

        <button
          type="button"
          className="text-slate-500 hover:text-slate-700"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Body */}
      {open && <div>{children}</div>}
    </div>
  );
}
