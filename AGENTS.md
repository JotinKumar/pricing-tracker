# AGENTS.md — Pricing Tracker

Read `README.md`, `docs/PRD.md`, `docs/TECHNICAL_SPEC.md`, `docs/STYLE_GUIDE.md`, and `docs/REFACTOR_GUIDE.md` before non-trivial changes.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind 4 · Prisma 6 + SQLite · TanStack Query · React Hook Form + Zod · Radix/shadcn · Framer Motion · Playwright. Node 18+, npm or pnpm.

## Layout
- `app/`: `dashboard/` (nested `admin/`), `login/`, `api/`. Special files lowercase (`page.tsx`, `layout.tsx`).
- `components/` feature-grouped: `activity-form/`, `admin-panel/`, `dashboard/`, `preferences/`, `storage/`, `ui/`.
- `lib/`: `actions/` (server actions), `db.ts` (Prisma), `schemas.ts` (Zod), `utils.ts`, `constants.ts`.
- `prisma/`, `hooks/`, `types/`, `storage/` (uploads), `tests/`, `docs/`.

## Conventions
- Files and folders: `kebab-case`. Components: `PascalCase`. Hooks/functions/vars: `camelCase`. Constants: `UPPER_SNAKE`. Types: `PascalCase`. Never use `camelCase`/`PascalCase` filenames (Linux case-sensitive).
- Default Server Components. Add `"use client"` only for state, effects, events, `framer-motion`, `@dnd-kit/*`, `react-hook-form`.
- Components ≤ ~150–200 lines. Split into container + presentational + `useFoo` hooks. Prefer composition over prop drilling.
- TypeScript: no `any`. Explicit prop and return types. Zod schemas in `lib/schemas.ts` drive both forms and server actions.
- Data: Prisma via `lib/db.ts` only. Mutations via server actions in `lib/actions/`. Reads via TanStack Query. Revalidate after writes.
- Auth: session-based, roles `ADMIN | MANAGER | USER | READ_ONLY`. Every server action must enforce role/ownership.
- A11y: semantic HTML, labelled inputs, keyboard nav, prefer Radix primitives.

## Documentation
After every change is implemented and validated, update `docs/PRD.md` to reflect the new behavior. Update `docs/TECHNICAL_SPEC.md` as well when the change affects architecture, data model, API, auth, or any other technical contract.

## Validation
`npm run lint` · `npx tsc --noEmit` · `npx prisma generate` after schema edits · `npx playwright test` for E2E.
