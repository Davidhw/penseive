"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Entry } from "@/lib/types";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarView({ entries }: { entries: Entry[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const d = new Date(e.createdAt);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return map;
  }, [entries]);

  const total = daysInMonth(cursor);
  const firstWeekday = cursor.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let i = 1; i <= total; i++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  const selectedEntries = selected
    ? byDay.get(`${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}`) ?? []
    : [];

  return (
    <section className="px-5 py-4 space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            className="btn-ghost !p-1.5"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-ink-700">{monthLabel}</h2>
          <button
            className="btn-ghost !p-1.5"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-[10px] text-ink-400 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const has = byDay.has(k);
            const isToday = sameDay(d, today);
            const isSelected = selected && sameDay(d, selected);
            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={`aspect-square rounded-lg text-sm flex items-center justify-center relative transition
                  ${isSelected ? "bg-accent text-white" : has ? "bg-accent/15 text-ink-800" : "text-ink-500 hover:bg-ink-100"}
                  ${isToday && !isSelected ? "ring-1 ring-accent" : ""}
                `}
              >
                {d.getDate()}
                {has && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider text-ink-500 px-1">
            {selected.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {selectedEntries.length === 0 ? (
            <p className="text-sm text-ink-400 px-1">No entries this day.</p>
          ) : (
            selectedEntries.map((e) => (
              <article key={e.id} className="card p-3">
                {e.prompt && <p className="text-xs italic text-ink-500 mb-1">{e.prompt}</p>}
                <p className="text-sm text-ink-800 whitespace-pre-wrap line-clamp-4">{e.body}</p>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
