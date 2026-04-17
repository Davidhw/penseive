export type Rating = "forgot" | "hard" | "good" | "easy";

export interface Entry {
  id: string;
  createdAt: number;
  updatedAt: number;
  prompt: string | null;
  body: string;
  // Spaced-repetition state
  dueAt: number;        // unix ms
  interval: number;     // days
  ease: number;         // multiplier
  reps: number;         // total successful reviews
  lapses: number;       // times forgotten
  lastReviewedAt: number | null;
}

export interface AppData {
  version: 1;
  entries: Entry[];
  exportedAt?: number;
}
