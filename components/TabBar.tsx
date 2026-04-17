"use client";

import { PenLine, Brain, Calendar, BookOpen, Settings, type LucideIcon } from "lucide-react";

export type TabId = "write" | "review" | "calendar" | "entries" | "settings";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "write", label: "Write", icon: PenLine },
  { id: "review", label: "Review", icon: Brain },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "entries", label: "Entries", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings },
];

export function TabBar({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <nav className="sticky bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-ink-200">
      <div className="max-w-md mx-auto flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`tab ${active === id ? "tab-active" : ""}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
