import type { AppData, Entry } from "./types";

const KEY = "pensieve.v1";

export function loadAll(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as AppData;
    return Array.isArray(data.entries) ? data.entries : [];
  } catch {
    return [];
  }
}

export function saveAll(entries: Entry[]) {
  if (typeof window === "undefined") return;
  const data: AppData = { version: 1, entries };
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function exportJSON(entries: Entry[]): string {
  const data: AppData = { version: 1, entries, exportedAt: Date.now() };
  return JSON.stringify(data, null, 2);
}

export function importJSON(json: string): Entry[] {
  const data = JSON.parse(json) as AppData;
  if (!data || data.version !== 1 || !Array.isArray(data.entries)) {
    throw new Error("Invalid Pensieve export file.");
  }
  return data.entries;
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
