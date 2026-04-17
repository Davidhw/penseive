"use client";

import { useState } from "react";
import { Download, Trash2, Github, Plus, RotateCcw, X, LogOut } from "lucide-react";
import type { Entry } from "@/lib/types";
import { exportJSON, downloadFile } from "@/lib/storage";
import { DEFAULT_PROMPTS } from "@/lib/prompts";

export function SettingsView({
  entries,
  email,
  onClear,
  onSignOut,
  prompts,
  onPromptsChange,
}: {
  entries: Entry[];
  email: string | null;
  onClear: () => void;
  onSignOut: () => void;
  prompts: string[];
  onPromptsChange: (prompts: string[]) => void;
}) {
  const [newPrompt, setNewPrompt] = useState("");

  const addPrompt = () => {
    const t = newPrompt.trim();
    if (!t || prompts.includes(t)) return;
    onPromptsChange([...prompts, t]);
    setNewPrompt("");
  };
  const removePrompt = (index: number) => {
    onPromptsChange(prompts.filter((_, i) => i !== index));
  };
  const resetPrompts = () => {
    if (confirm("Reset question presets to defaults?")) onPromptsChange(DEFAULT_PROMPTS);
  };

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`pensieve-${stamp}.json`, exportJSON(entries));
  };

  return (
    <section className="px-5 py-4 space-y-4">
      <div className="card p-4 space-y-3">
        <h2 className="font-semibold text-ink-700">Account</h2>
        {email && <p className="text-sm text-ink-600 truncate">{email}</p>}
        <button onClick={onSignOut} className="btn-secondary justify-start">
          <LogOut size={16} /> Sign out
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold text-ink-700">Your data</h2>
        <p className="text-xs text-ink-500">
          Synced to your account. Export a JSON copy for offline backup.
        </p>
        <button onClick={handleExport} className="btn-primary justify-start">
          <Download size={16} /> Export entries (JSON)
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-700">Question presets</h2>
          <button
            onClick={resetPrompts}
            className="btn-ghost !py-1 !px-2 text-xs"
            title="Reset to defaults"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
        {prompts.length === 0 ? (
          <p className="text-xs text-ink-400">No presets. Add one below or reset to defaults.</p>
        ) : (
          <ul className="space-y-1">
            {prompts.map((p, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-ink-700">
                <span className="flex-1 italic truncate">{p}</span>
                <button
                  onClick={() => removePrompt(i)}
                  aria-label={`Remove "${p}"`}
                  className="text-ink-300 hover:text-red-500 p-1 shrink-0"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addPrompt();
          }}
          className="flex gap-2"
        >
          <input
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="New question…"
            className="input flex-1 text-sm"
          />
          <button
            type="submit"
            disabled={!newPrompt.trim() || prompts.includes(newPrompt.trim())}
            className="btn-secondary disabled:opacity-40"
          >
            <Plus size={14} /> Add
          </button>
        </form>
      </div>

      <div className="card p-4 space-y-2">
        <h2 className="font-semibold text-ink-700">Stats</h2>
        <div className="text-sm text-ink-600 space-y-1">
          <div className="flex justify-between"><span>Entries</span><span>{entries.length}</span></div>
          <div className="flex justify-between">
            <span>Total reviews</span>
            <span>{entries.reduce((s, e) => s + e.reps + e.lapses, 0)}</span>
          </div>
        </div>
      </div>

      <div className="card p-4 space-y-2">
        <h2 className="font-semibold text-ink-700">Danger zone</h2>
        <button
          onClick={() => {
            if (confirm("Delete ALL entries? This cannot be undone.")) onClear();
          }}
          className="btn justify-start bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
        >
          <Trash2 size={16} /> Delete all entries
        </button>
      </div>

      <p className="text-center text-xs text-ink-400 flex items-center justify-center gap-1">
        <Github size={12} /> Pensieve · v0.1
      </p>
    </section>
  );
}
