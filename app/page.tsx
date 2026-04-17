"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Header } from "@/components/Header";
import { TabBar, type TabId } from "@/components/TabBar";
import { WriteView } from "@/components/WriteView";
import { ReviewView } from "@/components/ReviewView";
import { CalendarView } from "@/components/CalendarView";
import { EntriesView } from "@/components/EntriesView";
import { SettingsView } from "@/components/SettingsView";
import { LoginView } from "@/components/LoginView";
import { supabase } from "@/lib/supabase";
import {
  fetchEntries,
  upsertEntry,
  deleteEntry,
  deleteAllEntries,
} from "@/lib/storage";
import { DEFAULT_PROMPTS, fetchPrompts, savePrompts } from "@/lib/prompts";
import { applyRating, isDue, newEntryDefaults } from "@/lib/srs";
import { currentStreak } from "@/lib/streak";
import type { Entry, Rating } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [prompts, setPrompts] = useState<string[]>(DEFAULT_PROMPTS);
  const [tab, setTab] = useState<TabId>("write");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      setPrompts(DEFAULT_PROMPTS);
      setDataLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [e, p] = await Promise.all([fetchEntries(userId), fetchPrompts(userId)]);
      if (cancelled) return;
      setEntries(e);
      setPrompts(p && p.length > 0 ? p : DEFAULT_PROMPTS);
      setDataLoaded(true);
    })().catch((err) => {
      console.error("Failed to load data:", err);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const dueCount = useMemo(() => entries.filter(isDue).length, [entries]);
  const streak = useMemo(() => currentStreak(entries), [entries]);

  const addEntry = useCallback(
    (body: string, prompt: string) => {
      if (!userId) return;
      const now = Date.now();
      const e: Entry = {
        id: uid(),
        createdAt: now,
        updatedAt: now,
        prompt,
        body,
        ...newEntryDefaults(now),
      };
      setEntries((prev) => [e, ...prev]);
      upsertEntry(e, userId).catch((err) => console.error("addEntry failed:", err));
    },
    [userId]
  );

  const rate = useCallback(
    (id: string, rating: Rating) => {
      if (!userId) return;
      setEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? applyRating(e, rating) : e));
        const updated = next.find((e) => e.id === id);
        if (updated) {
          upsertEntry(updated, userId).catch((err) => console.error("rate failed:", err));
        }
        return next;
      });
    },
    [userId]
  );

  const remove = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      deleteEntry(id).catch((err) => console.error("remove failed:", err));
    },
    []
  );

  const clearAll = useCallback(() => {
    if (!userId) return;
    setEntries([]);
    deleteAllEntries(userId).catch((err) => console.error("clearAll failed:", err));
  }, [userId]);

  const updatePrompts = useCallback(
    (next: string[]) => {
      if (!userId) return;
      setPrompts(next);
      savePrompts(userId, next).catch((err) =>
        console.error("savePrompts failed:", err)
      );
    },
    [userId]
  );

  if (!sessionLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-ink-400">
        Loading…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col max-w-md mx-auto">
        <Header streak={0} dueCount={0} />
        <LoginView />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <Header streak={streak} dueCount={dueCount} />
      <main className="flex-1 pb-2">
        {!dataLoaded ? (
          <div className="px-5 py-12 text-center text-sm text-ink-400">Loading…</div>
        ) : tab === "write" ? (
          <WriteView onSave={addEntry} prompts={prompts} />
        ) : tab === "review" ? (
          <ReviewView entries={entries} onRate={rate} />
        ) : tab === "calendar" ? (
          <CalendarView entries={entries} />
        ) : tab === "entries" ? (
          <EntriesView entries={entries} onDelete={remove} />
        ) : (
          <SettingsView
            entries={entries}
            email={session.user.email ?? null}
            onClear={clearAll}
            onSignOut={() => supabase.auth.signOut()}
            prompts={prompts}
            onPromptsChange={updatePrompts}
          />
        )}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
