import { supabase } from "./supabase";
import type { AppData, Entry } from "./types";

type EntryRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  prompt: string | null;
  body: string;
  due_at: string;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  elapsed_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_reviewed_at: string | null;
};

function rowToEntry(r: EntryRow): Entry {
  return {
    id: r.id,
    createdAt: Date.parse(r.created_at),
    updatedAt: Date.parse(r.updated_at),
    prompt: r.prompt,
    body: r.body,
    dueAt: Date.parse(r.due_at),
    stability: Number(r.stability),
    difficulty: Number(r.difficulty),
    scheduledDays: r.scheduled_days,
    elapsedDays: r.elapsed_days,
    learningSteps: r.learning_steps,
    reps: r.reps,
    lapses: r.lapses,
    state: r.state,
    lastReviewedAt: r.last_reviewed_at ? Date.parse(r.last_reviewed_at) : null,
  };
}

function entryToRow(e: Entry, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    created_at: new Date(e.createdAt).toISOString(),
    updated_at: new Date(e.updatedAt).toISOString(),
    prompt: e.prompt,
    body: e.body,
    due_at: new Date(e.dueAt).toISOString(),
    stability: e.stability,
    difficulty: e.difficulty,
    scheduled_days: e.scheduledDays,
    elapsed_days: e.elapsedDays,
    learning_steps: e.learningSteps,
    reps: e.reps,
    lapses: e.lapses,
    state: e.state,
    last_reviewed_at: e.lastReviewedAt ? new Date(e.lastReviewedAt).toISOString() : null,
  };
}

export async function fetchEntries(userId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as EntryRow[]).map(rowToEntry);
}

export async function upsertEntry(e: Entry, userId: string): Promise<void> {
  const { error } = await supabase.from("entries").upsert(entryToRow(e, userId));
  if (error) throw error;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllEntries(userId: string): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("user_id", userId);
  if (error) throw error;
}

export function exportJSON(entries: Entry[]): string {
  const data: AppData = { version: 1, entries, exportedAt: Date.now() };
  return JSON.stringify(data, null, 2);
}

export function downloadFile(name: string, contents: string, type = "application/json") {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
