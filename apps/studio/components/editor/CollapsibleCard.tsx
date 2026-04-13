// components/editor/CollapsibleCard.tsx
"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

type Props = {
  title: string;
  children?: ReactNode;
};

export function CollapsibleCard({ title, children }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-md border border-slate-200 bg-white/90 shadow-sm">
      {/* compact header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2"
      >
        <span className="text-[11px] font-semibold tracking-[0.16em] text-slate-700 uppercase">
          {title}
        </span>

        <span className="text-slate-400">
          {open ? (
            <ChevronDown size={14} strokeWidth={1.7} />
          ) : (
            <ChevronRight size={14} strokeWidth={1.7} />
          )}
        </span>
      </button>

      {open && children && (
        <div className="border-t border-slate-200 bg-slate-50 px-3 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
