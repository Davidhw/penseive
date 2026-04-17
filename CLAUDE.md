# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint via `eslint-config-next`

There is no test runner configured.

## Architecture

Pensieve is a single-page Next.js 14 (App Router) micro-journaling app backed by **Supabase** (auth + Postgres). All UI is `"use client"`; there's no Next.js server logic beyond the static shell. Deployment is a stock Vercel Next.js app — requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` env vars.

### Auth

Magic-link email via `supabase.auth.signInWithOtp`. `app/page.tsx` gates the app on `session`: `LoginView` when unauthenticated, the tabbed app otherwise. Sign out is in `SettingsView`.

### State flow

`app/page.tsx` owns all state and is the only file that talks to the storage layer. It:
1. Subscribes to `supabase.auth` for session changes.
2. On login, fetches `entries` and `prompts` from Supabase (keyed by `user_id`), populates local React state.
3. Mutations (`addEntry`, `rate`, `remove`, `clearAll`, `updatePrompts`) update React state **optimistically** and fire-and-forget the DB write. Errors are logged, not surfaced.
4. Renders one of five tab views (`write` | `review` | `calendar` | `entries` | `settings`). Child components are pure and receive data + callbacks as props; they never import `lib/supabase.ts` or `lib/storage.ts`.

When editing features, preserve this pattern: Supabase access stays in `lib/storage.ts` + `lib/prompts.ts`, mutations stay in `page.tsx`, views stay presentational.

### Schema

`supabase/schema.sql` is the source of truth. Two tables, both with RLS scoped to `auth.uid() = user_id`:
- `entries` — one row per entry. Timestamps are `timestamptz` in DB; mapped to unix-ms `number` at the boundary (`rowToEntry` / `entryToRow` in `lib/storage.ts`). The in-memory `Entry` type (`lib/types.ts`) keeps the original camelCase + ms-timestamp shape.
- `prompts` — one row per user, `items text[]`.

If you change the `Entry` shape, update the SQL, the row mapper, and `lib/types.ts` together.

### Spaced repetition (`lib/srs.ts`)

Custom **SM-2-lite** algorithm. Each `Entry` carries its own SRS state (`dueAt`, `interval`, `ease`, `reps`, `lapses`, `lastReviewedAt`). Key functions:

- `newEntryDefaults(now)` — seeds new entries due tomorrow, interval 1d, ease 2.3.
- `applyRating(entry, rating)` — pure; returns a new entry. Ratings are `"forgot" | "hard" | "good" | "easy"`. `forgot` resets reps and decays ease; `easy` grows interval faster and boosts ease. Ease is floored at 1.3.
- `isDue(entry)` — `dueAt <= now`.
- `memoryStrength(entry)` — 0–100 heuristic (stability/recency + reps boost − lapse penalty). Explicitly "not science"; treat as UI-only.

If you tune the algorithm, keep `applyRating` pure and deterministic given `now` — page-level state relies on that.

### Module aliases

`@/*` resolves to the repo root (see `tsconfig.json`). Import as `@/components/...`, `@/lib/...`.

### Styling

Tailwind with a custom `ink` palette (warm off-white to near-black) and an `accent` purple, plus a serif font stack. `app/globals.css` holds base styles. The layout is mobile-first and capped at `max-w-md` — design changes should respect that constraint.
