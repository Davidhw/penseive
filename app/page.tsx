"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { TabBar, type TabId } from "@/components/TabBar";
import { WriteView } from "@/components/WriteView";
import { ReviewView } from "@/components/ReviewView";
import { CalendarView } from "@/components/CalendarView";
import { EntriesView } from "@/components/EntriesView";
import { SettingsView } from "@/components/SettingsView";
import { loadAll, saveAll } from "@/lib/storage";
import { applyRating, isDue, newEntryDefaults } from "@/lib/srs";
import { currentStreak } from "@/lib/streak";
import type { Entry, Rating } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Page() {
  const [hydrated, setHydrated] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tab, setTab] = useState<TabId>("write");

  useEffect(() => {
    setEntries(loadAll());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveAll(entries);
  }, [entries, hydrated]);

  const dueCount = useMemo(() => entries.filter(isDue).length, [entries]);
  const streak = useMemo(() => currentStreak(entries), [entries]);

  const addEntry = (body: string, prompt: string | null) => {
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
  };

  const rate = (id: string, rating: Rating) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? applyRating(e, rating) : e)));
  };

  const remove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <Header streak={streak} dueCount={dueCount} />
      <main className="flex-1 pb-2">
        {!hydrated ? (
          <div className="px-5 py-12 text-center text-sm text-ink-400">Loading…</div>
        ) : tab === "write" ? (
          <WriteView onSave={addEntry} />
        ) : tab === "review" ? (
          <ReviewView entries={entries} onRate={rate} />
        ) : tab === "calendar" ? (
          <CalendarView entries={entries} />
        ) : tab === "entries" ? (
          <EntriesView entries={entries} onDelete={remove} />
        ) : (
          <SettingsView
            entries={entries}
            onImport={(imported) => setEntries(imported)}
            onClear={() => setEntries([])}
          />
        )}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
