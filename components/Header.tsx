"use client";

import { Flame, Brain } from "lucide-react";

export function Header({ streak, dueCount }: { streak: number; dueCount: number }) {
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-800">Pensieve</h1>
        <p className="text-xs text-ink-500 -mt-0.5">remember what matters</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-ink-700">
          <Flame size={16} className="text-orange-500" />
          <span className="font-semibold">{streak}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-ink-700">
          <Brain size={16} className="text-accent" />
          <span className="font-semibold">{dueCount}</span>
        </div>
      </div>
    </header>
  );
}
