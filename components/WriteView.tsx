"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Sparkles, Save } from "lucide-react";
import { pickPrompt } from "@/lib/prompts";

export function WriteView({ onSave }: { onSave: (body: string, prompt: string | null) => void }) {
  const [prompt, setPrompt] = useState<string>("");
  const [body, setBody] = useState("");
  const [usePrompt, setUsePrompt] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrompt(pickPrompt());
  }, []);

  const refreshPrompt = () => setPrompt(pickPrompt(Math.random() * 1e9));

  const submit = () => {
    if (!body.trim()) return;
    onSave(body.trim(), usePrompt ? prompt : null);
    setBody("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
    setPrompt(pickPrompt(Math.random() * 1e9));
  };

  return (
    <section className="px-5 py-4 space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-ink-500">
            <input
              type="checkbox"
              checked={usePrompt}
              onChange={(e) => setUsePrompt(e.target.checked)}
              className="accent-accent"
            />
            Use prompt
          </label>
          <button
            onClick={refreshPrompt}
            disabled={!usePrompt}
            className="btn-ghost !py-1 !px-2 text-xs disabled:opacity-40"
          >
            <Sparkles size={14} /> New prompt
          </button>
        </div>
        {usePrompt && (
          <p className="text-ink-700 text-base italic leading-snug">{prompt}</p>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write what you want to remember…"
          className="input min-h-[180px] text-base leading-relaxed resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled
            title="Image attachments coming soon"
            className="btn-secondary !py-1.5 text-xs opacity-50 cursor-not-allowed"
          >
            <ImageIcon size={14} /> Add image
          </button>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-green-600">Saved ✓</span>}
            <button onClick={submit} disabled={!body.trim()} className="btn-primary disabled:opacity-40">
              <Save size={16} /> Save
            </button>
          </div>
        </div>
      </div>
      <p className="text-xs text-ink-400 px-1">
        Each entry enters a review schedule that quietly resurfaces it over time.
      </p>
    </section>
  );
}
