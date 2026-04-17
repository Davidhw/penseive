"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Save } from "lucide-react";
import { pickPrompt } from "@/lib/prompts";

export function WriteView({
  onSave,
  prompts,
}: {
  onSave: (body: string, prompt: string) => void;
  prompts: string[];
}) {
  const [prompt, setPrompt] = useState<string>("");
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrompt(pickPrompt(prompts));
    // Seed once per mount; preset list edits shouldn't clobber a question in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = () => {
    if (!body.trim() || !prompt.trim()) return;
    onSave(body.trim(), prompt.trim());
    setBody("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
    setPrompt(pickPrompt(prompts, Math.random() * 1e9));
  };

  return (
    <section className="px-5 py-4 space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-wide text-ink-400">Question</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) setPrompt(e.target.value);
            }}
            aria-label="Pick a preset question"
            className="input !py-1 !px-2 text-xs w-auto"
          >
            <option value="">Pick preset…</option>
            {prompts.map((p, i) => (
              <option key={i} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write or edit a question…"
          className="input text-base italic leading-snug text-ink-700"
        />
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
            <button
              onClick={submit}
              disabled={!body.trim() || !prompt.trim()}
              className="btn-primary disabled:opacity-40"
            >
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
