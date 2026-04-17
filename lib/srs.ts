import type { Entry, Rating } from "./types";

const DAY = 24 * 60 * 60 * 1000;

export function newEntryDefaults(now = Date.now()) {
  return {
    dueAt: now + DAY,
    interval: 1,
    ease: 2.3,
    reps: 0,
    lapses: 0,
    lastReviewedAt: null as number | null,
  };
}

// SM-2-lite. Predictable enough to feel honest without tuning data.
export function applyRating(entry: Entry, rating: Rating, now = Date.now()): Entry {
  let { interval, ease, reps, lapses } = entry;

  if (rating === "forgot") {
    lapses += 1;
    reps = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    reps += 1;
    if (rating === "hard") {
      interval = Math.max(1, Math.round(interval * 1.2));
      ease = Math.max(1.3, ease - 0.15);
    } else if (rating === "good") {
      interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ease);
    } else {
      interval = reps === 1 ? 3 : reps === 2 ? 7 : Math.round(interval * ease * 1.3);
      ease = ease + 0.05;
    }
  }

  return {
    ...entry,
    interval,
    ease,
    reps,
    lapses,
    lastReviewedAt: now,
    dueAt: now + interval * DAY,
    updatedAt: now,
  };
}

export function isDue(e: Entry, now = Date.now()) {
  return e.dueAt <= now;
}

// 0-100. Rough heuristic combining ease, reps, and recency. Not science.
export function memoryStrength(e: Entry, now = Date.now()): number {
  if (e.reps === 0) return 0;
  const recencyDays = (now - (e.lastReviewedAt ?? e.createdAt)) / DAY;
  const stability = e.interval; // proxy
  const score = (stability / (stability + recencyDays)) * 100;
  const repsBoost = Math.min(20, e.reps * 4);
  const lapsePenalty = Math.min(25, e.lapses * 8);
  return Math.max(0, Math.min(100, Math.round(score * 0.8 + repsBoost - lapsePenalty)));
}
