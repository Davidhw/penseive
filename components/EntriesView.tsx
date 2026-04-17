"use client";

import { useMemo, useState } from "react";
import { Trash2, Search } from "lucide-react";
import type { Entry } from "@/lib/types";
import { memoryStrength } from "@/lib/srs";

function strengthBar(s: number) {
  const color =
    s >= 70 ? "bg-emerald-500" : s >= 40 ? "bg-amber-500" : s > 0 ? "bg-orange-500" : "bg-ink-300";
  return (
    <div className="h-1 w-16 bg-ink-100 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${s}%` }} />
    </div>
  );
}

export function EntriesView({
  entries,
  onDelete,
}: {
  entries: Entry[];
  onDelete: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const sorted = useMemo(
    () =>
      [...entries]
        .filter((e) => {
          if (!q.trim()) return true;
          const needle = q.toLowerCase();
          return (
            e.body.toLowerCase().includes(needle) ||
            (e.prompt?.toLowerCase().includes(needle) ?? false)
          );
        })
        .sort((a, b) => b.createdAt - a.createdAt),
    [entries, q]
  );

  return (
    <section className="px-5 py-4 space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search entries"
          className="input pl-9"
        />
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-ink-400 text-center py-12">
          {entries.length === 0 ? "No entries yet. Write your first one." : "No matches."}
        </p>
      ) : (
        sorted.map((e) => (
          <article key={e.id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {e.prompt && (
                  <p className="text-xs italic text-ink-500 mb-1 truncate">{e.prompt}</p>
                )}
                <p className="text-sm text-ink-800 whitespace-pre-wrap line-clamp-4">{e.body}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Delete this entry?")) onDelete(e.id);
                }}
                className="text-ink-300 hover:text-red-500 p-1"
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-400">
              <span>{new Date(e.createdAt).toLocaleDateString()}</span>
              <div className="flex items-center gap-2">
                <span>{e.reps} review{e.reps === 1 ? "" : "s"}</span>
                {strengthBar(memoryStrength(e))}
              </div>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
