# Repository Guidelines

## Project Structure & Module Organization

This is a React 18 + TypeScript web application built with Vite.

```
src/
├── components/
│   ├── cards/       # Card display, search, modals
│   ├── deck/        # Deck builder UI
│   ├── export/      # Print/export functionality
│   ├── layout/      # App shell components
│   ├── ui/          # shadcn-ui base components
│   └── seo/         # SEO components
├── hooks/           # Custom React hooks
├── integrations/    # Supabase client
├── lib/             # Utilities, API clients
├── pages/           # Route components
└── types/           # TypeScript definitions
```

## Build, Test, and Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `http://localhost:8080` |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on all files |

**Package Manager:** Uses `npm` (has `bun.lockb`, but `package-lock.json` is preferred).

## Coding Style & Naming Conventions

- **Language:** TypeScript with strict mode.
- **Indentation:** 2 spaces.
- **Imports:** Use `@/` alias for `src/` imports (e.g., `import { Button } from "@/components/ui/button"`).
- **Components:** PascalCase files, export default component.
- **Hooks:** Prefix custom hooks with `use` (e.g., `useDebounce`).
- **Types:** Define in `src/types/`, use `.ts` extension.
- **Linting:** ESLint with `@typescript-eslint`, `react-hooks`, and `react-refresh` plugins.

## Testing Guidelines

- **Current State:** No test framework configured.
- **Before adding tests:** Discuss testing strategy with maintainers.

## Commit & Pull Request Guidelines

### Commit Message Format

Follow conventional commits pattern seen in history:

```
<type>: <description>

[optional body]
```

**Types:** `feat` (new feature), `fix` (bug fix), `refactor` (code change), `docs` (documentation), `minor` (tweaks).

**Examples:**
- `feat: add pagination to card search`
- `fix: resolve image loading in CardDetailModal`
- `refactor: extract API client to lib/`

### Pull Request Requirements

- Link related issues in PR description.
- Include screenshots for UI changes.
- Ensure `npm run lint` passes.
- Follow existing code patterns and TypeScript strictness.

## Architecture Overview

- **Frontend:** React 18 with hooks and context for state management.
- **Styling:** Tailwind CSS 3.4 + shadcn/ui components.
- **Backend:** Supabase (Auth, Database, Storage).
- **API:** YGOPRODeck API with 24-hour caching layer in `src/lib/`.
- **Performance:** Implements lazy loading, virtualization, code-splitting.

## Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

Variables must be prefixed with `VITE_` for client-side access.
