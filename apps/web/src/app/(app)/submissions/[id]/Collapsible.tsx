"use client";

import { ChevronDown, Users } from "lucide-react";
import { type ReactNode, useState } from "react";

export default function Collapsible({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false); // ← 操作(state)はこの島だけ

  return (
    <>
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
            open
              ? "border-slate-400 bg-slate-100 text-slate-700"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          }`}
        >
          <Users size={16} />
          {open ? `${label}を閉じる` : `${label}を見る`}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {open && <div className="space-y-4 animate-scale-in">{children}</div>}
    </>
  );
}
