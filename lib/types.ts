export type Rating = "forgot" | "hard" | "good" | "easy";

export interface Entry {
  id: string;
  createdAt: number;
  updatedAt: number;
  prompt: string | null;
  body: string;
  // FSRS card state
  dueAt: number;            // unix ms
  stability: number;
  difficulty: number;
  scheduledDays: number;
  elapsedDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number;            // 0 New, 1 Learning, 2 Review, 3 Relearning
  lastReviewedAt: number | null;
}

export interface AppData {
  version: 1;
  entries: Entry[];
  exportedAt?: number;
}
