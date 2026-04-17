import { supabase } from "./supabase";

export const DEFAULT_PROMPTS: string[] = [
  "What was the best part of your day?",
  "What interesting place did you visit today?",
  "What did you work on?",
  "What did you read/watch?",
  "Did you meet anyone new?",
];

export async function fetchPrompts(userId: string): Promise<string[] | null> {
  const { data, error } = await supabase
    .from("prompts")
    .select("items")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.items as string[] | undefined) ?? null;
}

export async function savePrompts(userId: string, prompts: string[]): Promise<void> {
  const { error } = await supabase.from("prompts").upsert({
    user_id: userId,
    items: prompts,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export function pickPrompt(prompts: string[], seed = Date.now()): string {
  if (prompts.length === 0) return "";
  return prompts[Math.floor((seed / 1000) % prompts.length)];
}
