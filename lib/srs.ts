import {
  fsrs,
  createEmptyCard,
  generatorParameters,
  Rating as FsrsRating,
  State,
  type Card,
} from "ts-fsrs";
import type { Entry, Rating } from "./types";

const params = generatorParameters({
  enable_fuzz: true,
  enable_short_term: true,
  maximum_interval: 365,
  request_retention: 0.9,
});
const scheduler = fsrs(params);

const RATING_MAP: Record<Rating, FsrsRating.Again | FsrsRating.Hard | FsrsRating.Good | FsrsRating.Easy> = {
  forgot: FsrsRating.Again,
  hard: FsrsRating.Hard,
  good: FsrsRating.Good,
  easy: FsrsRating.Easy,
};

function entryToCard(e: Entry): Card {
  return {
    due: new Date(e.dueAt),
    stability: e.stability,
    difficulty: e.difficulty,
    elapsed_days: e.elapsedDays,
    scheduled_days: e.scheduledDays,
    learning_steps: e.learningSteps,
    reps: e.reps,
    lapses: e.lapses,
    state: e.state as State,
    last_review: e.lastReviewedAt ? new Date(e.lastReviewedAt) : undefined,
  };
}

function writeCard(entry: Entry, card: Card, now: number): Entry {
  return {
    ...entry,
    dueAt: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    elapsedDays: card.elapsed_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReviewedAt: card.last_review ? card.last_review.getTime() : now,
    updatedAt: now,
  };
}

export function newEntryDefaults(now = Date.now()) {
  const card = createEmptyCard(new Date(now));
  return {
    dueAt: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    elapsedDays: card.elapsed_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReviewedAt: null as number | null,
  };
}

export function applyRating(entry: Entry, rating: Rating, now = Date.now()): Entry {
  const card = entryToCard(entry);
  const result = scheduler.repeat(card, new Date(now));
  const newCard = result[RATING_MAP[rating]].card;
  return writeCard(entry, newCard, now);
}

export function isDue(e: Entry, now = Date.now()): boolean {
  return e.dueAt <= now;
}

export function memoryStrength(e: Entry, now = Date.now()): number {
  if (e.state === State.New || e.reps === 0) return 0;
  const r = scheduler.get_retrievability(entryToCard(e), new Date(now), false);
  return Math.round(r * 100);
}

export type IntervalPreviews = Record<Rating, number>;

export function previewIntervals(entry: Entry, now = Date.now()): IntervalPreviews {
  const card = entryToCard(entry);
  const result = scheduler.repeat(card, new Date(now));
  return {
    forgot: result[FsrsRating.Again].card.due.getTime() - now,
    hard: result[FsrsRating.Hard].card.due.getTime() - now,
    good: result[FsrsRating.Good].card.due.getTime() - now,
    easy: result[FsrsRating.Easy].card.due.getTime() - now,
  };
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function formatInterval(ms: number): string {
  if (ms < MIN) return "<1m";
  if (ms < HOUR) return `${Math.round(ms / MIN)}m`;
  if (ms < DAY) return `${Math.round(ms / HOUR)}h`;
  if (ms < MONTH) return `${Math.round(ms / DAY)}d`;
  if (ms < YEAR) return `${Math.round(ms / MONTH)}mo`;
  return `${Math.round(ms / YEAR)}y`;
}
