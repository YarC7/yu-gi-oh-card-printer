# AGENTS.md

## Commands

- `npm run dev` — Vite dev server on port **8080** (per `vite.config.ts`; README's 5173 is stale).
- `npm run build` / `npm run build:dev` / `npm run preview` / `npm run lint` (`eslint .`).
- No test, typecheck, or format scripts. Do not add a test framework unasked.
- CI (`.github/workflows/deploy.yml`, Node 20): `npm ci`, then `npm run build -- --base="<pages-base>/"`, then `cp dist/index.html dist/404.html` (SPA fallback for GitHub Pages). Deploys on push to `main`/`master`.
- `npm` is the source of truth (`package-lock.json`); `bun.lockb` is leftover, ignore it.

## Env

Copy `.env.example` → `.env` (`.env.local` also works) with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. All client vars need the `VITE_` prefix. CI injects the same three via secrets.

## Structure

- Entrypoint: `src/main.tsx` → `src/App.tsx`. Routes are lazy-loaded (`Index`, `Auth`, `Search`, `DeckBuilder`, `History`, `NotFound`); add new pages the same way with a `Suspense` fallback already in place.
- `BrowserRouter basename={import.meta.env.BASE_URL}` — required for GitHub Pages subpath; do not remove.
- Path alias `@/*` → `src/*` (defined in both `vite.config.ts` and `tsconfig*.json`). Import via `@/`, e.g. `@/components/ui/button`.
- `src/lib/`: `ygoprodeck-api.ts` (search entry), `card-cache-service.ts` (Supabase cache), `deck-service.ts`, `custom-cards-service.ts`, `ydk-parser.ts`, `utils.ts` (shadcn `cn()`).
- `src/hooks/`: `useAuth`, `useBanList`, `useDeck` providers/consumers — check these before adding new global state.
- `src/integrations/supabase/` holds the client and generated `types.ts`; do not hand-edit `types.ts`.

## Data layer — read before touching search

- Always go through `searchCards()` in `src/lib/ygoprodeck-api.ts`. It tries Supabase cache first (`searchCardsAdvanced`, fuzzy + suggestions), falls back to the YGOPRODeck API (`https://db.ygoprodeck.com/api/v7`), and records search history. Do not fetch the API directly.
- Two cache layers: in-memory `Map` with 24h TTL in `ygoprodeck-api.ts` + Supabase table with 7-day sync (`SYNC_INTERVAL_DAYS` in `card-cache-service.ts`). Clear only via `apiClient.clearCache()` / cache-service helpers.
- API client quirks: 50ms rate-limit throttle, 3 retries (429/5xx + network `fetch` errors), in-flight request dedup map. Keyword search (≥2 chars) fires parallel `fname` + `desc` queries and merges/dedups by card id.
- `getCardsByIds()` batches missing ids in groups of 50 — keep that batching.
- Supabase: local `supabase/migrations/` (2 files) is the migration source; root-level `*.sql` (`supabase_setup.sql`, `cached_cards_table.sql`, `fts_rpc_function.sql`, `fulltext_search_migration.sql`, `fix_rls.sql`) are one-off scripts — read them for context but put new schema changes in a migration.

## TypeScript / lint reality (lenient)

- `tsconfig.app.json` has `"strict": false`, `noImplicitAny`/`noUnusedLocals`/`noUnusedParameters` all false. Do not assume strict null checks.
- ESLint: `@typescript-eslint/no-unused-vars` is **off**. `npm run lint` will not catch unused vars or many type issues — self-review diffs.

## UI conventions

- shadcn-ui per `components.json` (style `default`, base color `slate`, CSS variables, aliases `@/components/ui`, `@/lib/utils`, `@/hooks`). Add primitives via the shadcn CLI pattern, don't hand-duplicate `ui/` components.
- Tailwind 3.4 + `tailwindcss-animate`; global CSS in `src/index.css`. 2-space indent, PascalCase components, `use*` hook prefix, shared types in `src/types/*.ts`.

## Gotchas

- `src/lib/*.bak*` files (`ygoprodeck-api.ts.bak`, `card-cache-service.ts.bak2`) are stale backups — never import them; delete only if asked.
- `lovable-tagger` runs only in development mode (`vite.config.ts`); production build omits it.
- Commits follow `<type>: <description>` with types `feat|fix|refactor|docs|minor` (see `git log`). For PRs: link issues, attach screenshots for UI changes, ensure `npm run lint` passes.
