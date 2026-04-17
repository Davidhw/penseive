"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { Entry, Rating } from "@/lib/types";
import { isDue, memoryStrength } from "@/lib/srs";

const RATINGS: { id: Rating; label: string; hint: string; color: string }[] = [
  { id: "forgot", label: "Forgot", hint: "no recall", color: "bg-red-500 hover:bg-red-600" },
  { id: "hard", label: "Hard", hint: "barely", color: "bg-orange-500 hover:bg-orange-600" },
  { id: "good", label: "Good", hint: "remembered", color: "bg-emerald-500 hover:bg-emerald-600" },
  { id: "easy", label: "Easy", hint: "instantly", color: "bg-sky-500 hover:bg-sky-600" },
];

export function ReviewView({
  entries,
  onRate,
}: {
  entries: Entry[];
  onRate: (id: string, rating: Rating) => void;
}) {
  const due = useMemo(
    () => entries.filter(isDue).sort((a, b) => a.dueAt - b.dueAt),
    [entries]
  );
  const [revealed, setRevealed] = useState(false);

  if (due.length === 0) {
    return (
      <section className="px-5 py-12 text-center">
        <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
        <h2 className="mt-3 text-lg font-semibold text-ink-700">All caught up</h2>
        <p className="mt-1 text-sm text-ink-500">
          No memories are due right now. Come back tomorrow.
        </p>
      </section>
    );
  }

  const current = due[0];
  const strength = memoryStrength(current);

  const rate = (r: Rating) => {
    onRate(current.id, r);
    setRevealed(false);
  };

  return (
    <section className="px-5 py-4 space-y-4">
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>{due.length} due</span>
        <span>strength {strength}%</span>
      </div>
      <div className="card p-5 min-h-[260px] flex flex-col">
        {current.prompt && (
          <p className="text-ink-500 italic text-sm mb-3">{current.prompt}</p>
        )}
        {revealed ? (
          <p className="text-ink-800 whitespace-pre-wrap leading-relaxed">{current.body}</p>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <button onClick={() => setRevealed(true)} className="btn-secondary">
              <RotateCcw size={16} /> Reveal entry
            </button>
          </div>
        )}
        <p className="mt-4 text-xs text-ink-400">
          Written {new Date(current.createdAt).toLocaleDateString()} · reviewed {current.reps}×
        </p>
      </div>

      {revealed && (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.id}
              onClick={() => rate(r.id)}
              className={`${r.color} text-white rounded-lg py-3 flex flex-col items-center text-xs font-semibold transition active:scale-[0.97]`}
            >
              <span>{r.label}</span>
              <span className="font-normal opacity-80">{r.hint}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
