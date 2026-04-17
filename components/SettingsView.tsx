"use client";

import { useRef } from "react";
import { Download, Upload, Trash2, Github } from "lucide-react";
import type { Entry } from "@/lib/types";
import { exportJSON, importJSON, downloadFile } from "@/lib/storage";

export function SettingsView({
  entries,
  onImport,
  onClear,
}: {
  entries: Entry[];
  onImport: (entries: Entry[]) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`pensieve-${stamp}.json`, exportJSON(entries));
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const imported = importJSON(text);
      if (
        confirm(
          `Import ${imported.length} entries? This will replace your current ${entries.length} entries.`
        )
      ) {
        onImport(imported);
      }
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    }
  };

  return (
    <section className="px-5 py-4 space-y-4">
      <div className="card p-4 space-y-3">
        <h2 className="font-semibold text-ink-700">Your data</h2>
        <p className="text-xs text-ink-500">
          Everything lives in this browser. Back up regularly.
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={handleExport} className="btn-primary justify-start">
            <Download size={16} /> Export entries (JSON)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-secondary justify-start"
          >
            <Upload size={16} /> Import from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = "";
            }}
          />
        </div>
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
