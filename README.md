# Pensieve

A tiny micro-journaling web app. Capture short reflections; spaced-repetition surfaces them again over time so you actually remember.

Everything lives in your browser's `localStorage`. No backend, no account, no tracking.

## Features (v0.1)

- Write entries with optional rotating prompts
- Simplified SM-2 spaced-repetition review queue (Forgot / Hard / Good / Easy)
- Per-entry "memory strength" indicator
- Calendar view with daily entry markers
- Searchable entry list
- Daily streak counter
- JSON export & import (your backup)
- Mobile-first layout, installable as a PWA via the browser

Image attachments are stubbed in the UI but disabled in v0.1.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploy to Vercel

This is a stock Next.js 14 app. To deploy:

1. Push this branch to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. Pick the branch `claude/micro-journaling-app-FaINp`.
4. Leave all defaults — Vercel auto-detects Next.js.
5. Click **Deploy**.

No environment variables needed.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- lucide-react (icons)

## Data

All entries are stored under `localStorage["pensieve.v1"]` as JSON. Use Settings → Export to back them up. Use Import to restore (or move between browsers).
