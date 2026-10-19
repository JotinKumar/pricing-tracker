# Pricing Tracker — Technical Specification

> Last updated: July 23, 2026.
> This document describes the current architecture, package versions, and engineering patterns used in the Pricing Tracker application.

---

## 1. Overview

Pricing Tracker is a single-tenant, internal full-stack web application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Prisma**, and **Tailwind CSS v4**. It uses **server actions** as the primary data-access layer, **SQLite** for local development, and a deliberately simplified cookie-based session for authentication.

This spec captures the state of the codebase after the latest dependency refresh (Next.js 16.2.10, React 19.2.3, Tailwind v4, Prisma 6.19.1, etc.).

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser                                    │
│  (React 19 + Next.js App Router + Tailwind v4 + shadcn/ui)         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    Next.js 16 Server / Edge                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ App Router   │  │ Server Actions│  │ Route Handlers (storage) │  │
│  │ pages/layouts│  │ (lib/actions) │  │ (api/storage/[id])       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                         Prisma ORM 6.19.1                              │
│              (SQLite in dev; replaceable in production)               │
└─────────────────────────────────────────────────────────────────────┘
```

Key characteristics:
- **Server-first data fetching**: most pages are Server Components; mutations happen through Server Actions.
- **Client Components** are limited to interactive surfaces (forms, tables, drag-and-drop, modals, charts).
- **No REST API**: the server-action layer replaces traditional API routes for reads and writes.
- **Single-tier deployment**: a single Next.js process serves the UI, actions, and file downloads.

---

## 3. Technology Stack

| Layer | Package | Version |
| --- | --- | --- |
| Framework | `next` | `^16.2.10` |
| Runtime | `react` / `react-dom` | `19.2.3` |
| Language | `typescript` | `^5` |
| Styling | `tailwindcss` / `@tailwindcss/postcss` | `^4` |
| UI primitives | `shadcn/ui` (Radix wrappers) | latest compatible |
| Forms | `react-hook-form` | `^7.71.1` |
| Validation | `zod` | `^4.3.5` |
| Server actions | Next.js built-in + `zod` | — |
| ORM | `@prisma/client` / `prisma` | `^6.19.1` |
| Database | SQLite (dev) | file-based via `DATABASE_URL` |
| Local storage | Node.js `fs` | `storage/uploads/` |
| Themes | `next-themes` | `^0.4.6` |
| Animation | `framer-motion` | `^12.27.5` |
| Drag & drop | `@dnd-kit/*` | `core 6.3.1`, `sortable 10.0.0` |
| Icons | `lucide-react` | `^0.562.0` |
| Query | `@tanstack/react-query` | `^5.90.19` |
| E2E testing | `@playwright/test` | `^1.58.1` |
| Linting | `eslint` / `eslint-config-next` | `^9` / `^16.2.10` |
| Seed runtime | `tsx` | `^4.21.0` |

### Notable dependency facts
- Next.js 16 ships with **Turbopack** by default for `next dev`.
- Tailwind v4 is CSS-first: no `tailwind.config.js`; theming is driven through CSS variables in `app/globals.css`.
- React 19 is used directly (not the latest 19.x release), pinned to `19.2.3`.
- Prisma 6.19.1 is the current ORM version; the engine binary is generated into `node_modules/.prisma/client`.

---

## 4. Project Structure

```
app/                         # Next.js App Router
  login/page.tsx             # email-only login
  dashboard/page.tsx         # main dashboard (Server Component)
  dashboard/activity/new/page.tsx   # create-activity full page (Server Component)
  dashboard/activity/[id]/page.tsx  # edit-activity full page (Server Component)
  dashboard/admin/page.tsx   # admin panel (Server Component)
  dashboard/layout.tsx       # dashboard shell with auth guard
  api/storage/[id]/route.ts  # file download route handler

components/                  # feature-based React components
  admin-panel/               # admin UI (sidebar, tables, modals, tabs)
  dashboard/                 # dashboard table, filters, pagination, controls
  activity-form/             # create/edit activity form (page + tabbed sections)
    activity-form.tsx        # full-page tabbed form (client)
    activity-form-page.tsx   # client wrapper handling route navigation on save/cancel
    sections/                # primary, location, financial, date, status, stakeholder sections
  ui/                        # shadcn/ui primitives
  storage/                   # file attachment UI
  navbar.tsx, navbar-logo.tsx

hooks/                       # client-side custom hooks
  use-admin-data.ts
  use-activity-comments.ts
  use-storage.ts
  use-id-format.ts
  ...

lib/                         # shared server/client code
  actions/                   # server actions (auth, admin, activity, user, storage, ...)
  db.ts                      # Prisma client singleton
  schemas.ts                 # Zod schemas (activity, admin user, admin lookup)
  constants.ts               # status styles, team order constants
  utils.ts                   # cn() and helpers

types/                       # centralized TypeScript types
  domain/                    # entity types (user, activity, lookups, config)
  forms/                     # form-derived types
  api/                       # API/response types
  shared/                    # shared utility types

prisma/                      # schema, migrations, seed data
  schema.prisma
  seed.ts, seed-data.ts, seed-user.ts, ...
  migrations/

tests/e2e/                   # Playwright specs
storage/uploads/             # local file uploads (gitignored)
```

---

## 5. Frontend Architecture

### 5.1 Rendering model
- **Server Components** by default for pages and data-heavy shells.
- **Client Components** (`'use client'`) are used for:
  - Forms and inputs (`react-hook-form`)
  - Drag-and-drop reordering (`@dnd-kit`)
  - Interactive tables, filters, and pagination
  - Theme switching and local preferences
  - File uploads and comments

### 5.2 State management
- **URL state**: dashboard filters, pagination, view mode, and admin active tab are encoded in query parameters. This makes views shareable and SSR-friendly.
- **Server state**: cached via `@tanstack/react-query` where appropriate; server actions refetch data after mutations.
- **Local state**: React `useState` / `useReducer` for modals, form state, and ephemeral UI state.
- **Global state**: minimal. Theme is managed by `next-themes`; user preferences are persisted to the DB and revalidated via server actions.

### 5.3 Forms
- `react-hook-form` for controlled inputs.
- `zod` schemas in `lib/schemas.ts` for validation. The `activitySchema` includes optional
  `tcv`, `dealDuration`, and `subverticalId` (preprocessed to handle empty strings/`null`).
- The activity create/edit form is a **full-page** client component
  (`components/activity-form/activity-form.tsx`) rendered inside dedicated routes
  (`/dashboard/activity/new`, `/dashboard/activity/[id]`). A thin client wrapper
  (`activity-form-page.tsx`) handles `router.push('/dashboard')` + `router.refresh()` on
  save/cancel. The page uses a Radix `Tabs` to split sections (Details, Location,
  Financials, Deal Team, Comments, Attachments) while keeping Version/Status/Outcome and
  Due/Assign dates in a always-visible top card outside the tabs. The header Save button
  submits via an explicit `form="activity-form"` attribute so it works from any tab.
- Server actions return `ApiResponse` with optional `errors` map; the UI maps these back to form fields.

### 5.4 Styling
- **Tailwind CSS v4** with CSS-first configuration.
- CSS variables for theme tokens in `app/globals.css`.
- **shadcn/ui** primitives extended via `class-variance-authority` (CVA).
- `framer-motion` for page transitions, modal animations, and micro-interactions.
- `lucide-react` for icons.

---

## 6. Backend Architecture

### 6.1 Server actions
All data access from the UI goes through functions in `lib/actions/`. These are marked `'use server'` and are the canonical replacement for REST/GraphQL endpoints.

| Action file | Responsibility |
| --- | --- |
| `auth.ts` | login, logout, session read |
| `admin.ts` | CRUD for users, teams, lookup tables (incl. Subvertical with parent Vertical), display-order updates; system settings |
| `activity.ts` | create, read, update pricing activities; `getActivityById`, `getActivityFormLookups` for the activity page |
| `user.ts` | user lookups, preferences |
| `storage.ts` | file upload metadata and file download |
| `defaults.ts` | default assignment rules |
| `field-config.ts` | `id1`/`id2`/fiscal field configuration |

Every action calls `getSession()` and enforces role checks server-side.

### 6.2 Authentication
- Session cookies are HMAC-signed using the required server-only `SESSION_SECRET` environment variable. Missing configuration prevents session signing; no fallback secret is embedded in source.
- Simplified email-only login.
- Server action looks up the user by email and sets an HTTP-only `session` cookie containing a JSON payload (`id`, `role`, `name`, `email`).
- Session lifetime: 7 days.
- Unknown emails are auto-created as `USER` in development; `admin@example.com` and `manager@example.com` are auto-provisioned with elevated roles.
- `getSession()` re-fetches the user from the DB on each call to keep role/active state fresh.

### 6.3 Route handlers
- `app/api/storage/[id]/route.ts` serves file downloads keyed by `id1`.
- Currently does not perform authentication/authorization checks (noted in §10 as a production gap).

---

## 7. Database Schema

Full schema: `prisma/schema.prisma`.

### Core tables
- **User** — id, email, name, role, manager relation, teams, preferences, active flag.
- **Team** — functional team name, display code, order, active flag.
- **PricingActivity** — central deal/activity entity; relations to vertical, optional sub-vertical, horizontal, status, category, version, outcome, locations, creator, team members, comments. Financial scalars: `annualContractValue` (ACV), `tcv` (Total Contract Value, nullable), `dealDuration` (months, nullable). `subverticalId` is nullable.
- **ActivityTeamMember** — join table (activity, user, team).
- **Comment** — activity thread, cascade-deleted with activity.
- **Attachment** — file metadata keyed by `id1`.

### Lookup tables
All lookup tables share: `id`, `display` (short code), `displayOrder`, `isActive`.

| Model | Primary field | Extra field |
| --- | --- | --- |
| `Team` | `teamname` | — |
| `Vertical` | `vertical` | — |
| `Subvertical` | `subvertical` | required `verticalId` parent (Vertical) |
| `Horizontal` | `horizontal` | — |
| `Location` | `country` | `currency` |
| `Status` | `status` | — |
| `Category` | `category` | — |
| `Version` | `version` | — |
| `Outcome` | `outcome` | — |
| `DocumentType` | `type` | — |
| `SalesforceStage` | `stage` | `description` |

### Configuration tables
- **DefaultAssignment** — auto-assignment rules (`type`, optional `referenceId`, `userId`).
- **FieldConfig** — per-field configuration for `id1`/`id2` labels, types, prefixes, and dashboard visibility.
- **SystemSetting** — global key/value store.

---

## 8. API / Integration Patterns

### 8.1 Server-action response shape
All server actions return `ApiResponse<T>`:

```ts
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string>
}
```

### 8.2 Client-to-server flow
1. Client Component collects form/query state.
2. Server action validates with Zod and enforces auth/role checks.
3. Prisma performs the mutation.
4. Server action returns success or validation errors.
5. Client either shows a toast, maps errors to fields, or updates local state.

### 8.3 Revalidation
- Server actions call `revalidatePath` where applicable (e.g., system settings updates).
- Most admin/dashboard data is refetched by calling the server action again from the client after a mutation.

---

## 9. Testing Strategy

| Type | Tool | Coverage |
| --- | --- | --- |
| E2E | Playwright | `tests/e2e/`: filters, comprehensive dashboard flows |
| Lint | ESLint | entire project via `npm run lint` |
| Typecheck | TypeScript | `npx tsc --noEmit` |
| Manual | Browser smoke tests | admin panel, activity create/edit, file upload |

Current gaps: no unit tests, no component tests, no dedicated auth/admin e2e coverage.

---

## 10. Build & Deployment

### Scripts
```bash
npm run dev      # next dev (Turbopack)
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
```

### Setup
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

### Deployment considerations
- Next.js 16 supports self-hosting or Vercel.
- SQLite and local file storage are suitable for development only; production should use a managed Postgres and an object store (S3/R2).
- The current session cookie contains HMAC-signed JSON; its contents are not encrypted. Production authentication remains a separate requirement.

---

## 11. Security Notes

- Role checks are enforced server-side in every action.
- Session cookie is HTTP-only and HMAC-signed, but not encrypted.
- `/api/storage/[id]` is currently unauthenticated.
- Dev auto-user-creation should be disabled in production.
- CSRF protection is handled by Next.js server actions automatically when called from the same origin.

---

## 12. Development Workflow & Conventions

- Follow `docs/STYLE_GUIDE.md` for file/folder naming (kebab-case, lowercase special files).
- Follow `docs/REFACTOR_GUIDE.md` for component limits, hook extraction, and server/client split.
- Prefer Server Components; add `'use client'` only when necessary.
- Keep components under ~150–200 lines; extract hooks and presentational components when exceeding.
- Avoid `any`; prefer explicit types.
- Run `npx tsc --noEmit` and `npm run lint` before committing.
- Update this PRD and technical spec when adding new features or changing the data model.

---

## 13. Known Issues & Production Gaps

1. **Schema drift**: some client code references preference columns (`preferenceSortOrder`, `preferenceCurrency`, `statusMessage`, `statusIndicator`) that do not exist in `prisma/schema.prisma`.
2. **Typecheck failures**: `npx tsc --noEmit` reports multiple errors from schema drift, duplicate `FieldConfig` definitions, and type mismatches.
3. **Lint errors**: numerous `no-explicit-any` and `no-require-imports` errors in server actions, seed files, and one-off scripts.
4. **Tracked SQLite DB**: `prisma/dev.db` is tracked in git; it should be gitignored.
5. **Session security**: plaintext JSON cookie, dev auto-user-creation, unauthenticated storage route.
6. **No unit/component tests**.
7. **Migration hygiene**: some migrations add and remove the same field (`isVisible`); they should be squashed.

These are tracked in the PRD backlog and should be addressed before production deployment.
