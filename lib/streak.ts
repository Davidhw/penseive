import type { Entry } from "./types";

const DAY = 24 * 60 * 60 * 1000;

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function entryDays(entries: Entry[]): Set<string> {
  return new Set(entries.map((e) => dayKey(e.createdAt)));
}

export function currentStreak(entries: Entry[], now = Date.now()): number {
  if (entries.length === 0) return 0;
  const days = entryDays(entries);
  let streak = 0;
  let cursor = new Date(now);
  // If today has no entry, allow starting from yesterday so the streak doesn't break mid-day
  if (!days.has(dayKey(cursor.getTime()))) {
    cursor = new Date(now - DAY);
    if (!days.has(dayKey(cursor.getTime()))) return 0;
  }
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY);
  }
  return streak;
}

export function totalDays(entries: Entry[]): number {
  return entryDays(entries).size;
}
