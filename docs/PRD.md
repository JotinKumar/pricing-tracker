# Pricing Tracker — Product Requirements Document

> Status: Living document. Replaces the former `PROJECT_DOCUMENTATION.md` and `PLAN.md`.
> Last updated: July 23, 2026 (post full-project audit).

---

## 1. Overview

**Pricing Tracker** is an internal, single-tenant web application that a pricing/sales
organization uses to manage the lifecycle of **pricing activities** (deals/opportunities)
from intake through closure. Each activity tracks the client, the deal team across
functional teams, financials, status, and outcome, plus collaborative artifacts
(comments and file attachments keyed to a Salesforce ID).

The product is a **Next.js 16 (App Router)** full-stack app with **Prisma + SQLite**
in development, **server actions** for the data layer, and a **shadcn/ui + Tailwind v4**
frontend. Authentication is a deliberately simplified, email-only, cookie-based session
suitable for an internal prototype — not production-grade.

Session cookies require a private `SESSION_SECRET` environment variable. Login fails if it is missing; there is no built-in fallback secret.

### 1.1 Goals

- Provide a single place to create, assign, track, and report on pricing activities.
- Support a cross-functional deal team model (Pricing, Solution, Sales, Finance, etc.).
- Enforce role-based visibility (Admin / Manager / User / Read-Only).
- Allow per-user preferences (theme, ACV unit/decimals/currency, date format, custom sort order, status message, status indicator).
- Keep the data model flexible via configurable lookup tables and field configs.

### 1.2 Non-Goals (current scope)

- Production authentication (OAuth/SAML, passwords, MFA).
- Multi-tenant isolation.
- External Salesforce/ERP integration (IDs are stored as strings only).
- Real-time collaboration (WebSockets, presence).
- Public API or mobile app.

---

## 2. Personas & Roles

| Role | Capabilities |
| --- | --- |
| `ADMIN` | Full access: all activities, admin panel (users, teams, all lookups, defaults, system settings, field configs, preferences). |
| `MANAGER` | Create/edit activities they own or are assigned to; view reports. Cannot access admin panel. |
| `USER` | Create/edit activities they own or are assigned to as a team member. |
| `READ_ONLY` | View assigned activities only. No inline edits, no create. |

> Role checks are enforced server-side in every server action via `getSession()`.

---

## 3. Functional Requirements

### 3.1 Authentication & Session

- Email-only login (no password). Server action looks up the user by email and sets an
  HTTP-only, **HMAC-signed** `session` cookie containing a JSON payload (`id`, `role`, `name`, `email`, `avatar`, preference fields, and status fields).
- **Dev fallback**: `admin@example.com` is auto-provisioned as `ADMIN` and `manager@example.com` as `MANAGER` in non-production environments. Other unknown emails are rejected with "User not found."
- Session lifetime: 7 days.
- `getSession()` parses and verifies the cookie signature, then re-fetches the user from the DB on each call to keep role/active state fresh.

### 3.2 Activity Management (core entity: `PricingActivity`)

- **Create / Edit** via a dedicated full-page form (no longer a modal popup) at
  `/dashboard/activity/new` (create) and `/dashboard/activity/[id]` (edit). The page is
  reached from the dashboard's "Add New" button and row edit action; on save or cancel it
  navigates back to `/dashboard` and refreshes.
- **Page layout**: a top "Status & Dates" card always-visible above the tabs holds
  **Version**, **Current Status**, **Outcome**, **Due Date**, and **Assigned Date** so the
  lifecycle fields are immediately editable without navigating into a tab. Below the top
  card, a tab bar breaks the remaining content into focused tabs:
  - **Details** — primary details (IDs, client, project, vertical, sub-vertical, horizontal).
  - **Location** — client and delivery locations.
  - **Financials** — category, ACV, **TCV** (Total Contract Value), and **Deal Duration**
    (months).
  - **Deal Team** — stakeholders / team members with auto-assignment.
  - **Comments** — per-activity thread (with a count badge on the tab).
  - **Attachments** — file uploads keyed to `id1`.
  A header-level Save button submits the form regardless of the active tab.
- **Sub-Vertical**: the Details tab shows a **Sub-Vertical** dropdown only when the selected
  vertical has sub-verticals defined in the admin panel. If the vertical has none, the field
  is hidden. Changing the vertical clears an incompatible sub-vertical selection.
- **Identifiers**: `id1` (Salesforce number, required) and `id2` (secondary ID, optional in the UI but stored as a non-empty string in the DB).
  Both are free-form strings; `id1` is the join key for attachments.
- **Lifecycle** is driven by `Outcome`: `Pipeline` / `Won` / `Lost` / `Dropped` / `Inactive`.
  The dashboard exposes three view modes that filter by outcome: `pipeline`, `closed`, `inactive`.
- **Inline updates**: status can be changed directly from the table row. Version changes
  require opening the full edit form (now the activity page).
- **Comments**: per-activity thread with author attribution; author or admin may delete.
  Comments can also be opened in a quick modal directly from the dashboard row.
- **Attachments**: files are uploaded against an `id1` (Salesforce ID) and shared across
  every activity sharing that ID. Stored on the local filesystem under `storage/uploads/`.
  The download route (`/api/storage/[id]`) requires an authenticated session. Attachments
  can also be opened in a quick modal directly from the dashboard row.

### 3.3 Deal Team & Auto-Assignment

- An activity has many `ActivityTeamMember` rows, each linking a `User` to a `Team` on that
  activity (many-to-many across functional teams).
- **Hidden system members**: the activity creator's upstream manager chain is automatically
  added as implicit team members on submit (merged with explicit UI selections).
- **Default assignments**: admins can define rules ("for Vertical X, default user Y") that
  the create form uses to suggest team members based on the selected
  vertical/horizontal/locations.

### 3.4 Dashboard

- **URL-driven state**: search, view mode, pagination, and all filters are encoded in query
  params so views are shareable and SSR-friendly.
- **Filtering**: by status, category, version, vertical, client/delivery location, deal-team
  member (per team), client name, `id1`/`id2`, and ACV range (slider) and
  due-date range (slider with bounds fetched from the DB). Filter dropdowns are faceted to
  only values present in the current result set. Clicking a row cell (vertical, client,
  version, category, location, team member, ID) also applies that filter.
- **Grouping**: group activities by client or vertical with expand/collapse.
- **Pagination**: server-side with Prev/Next page buttons on top of an initial SSR page.
  The page size is dynamically sized to the viewport's visible row capacity.
- **Per-user sort order**: verticals, horizontals, and locations can be reordered via
  drag-and-drop in the preferences modal and persisted as JSON on the user. Team sort order
  is supported in the data model but not exposed in the preferences UI.

### 3.5 Admin Panel (ADMIN only)

- **Users**: CRUD with role, manager (hierarchy), teams, avatar, designation, active flag.
- **Teams**: CRUD with display name and order.
- **Lookups**: Vertical, **Subvertical** (parented to a Vertical), Horizontal, Location (with currency), Status, Category, Version,
  Outcome, DocumentType, and **SalesforceStage** — all with `display`, `displayOrder`, `isActive`.
  SalesforceStage additionally stores a `description` and seeds Stage 1–Stage 10 with
  display codes 1–10. Display codes are auto-generated when creating new lookup records.
  The Subvertical table shows a parent **Vertical** column and its create/edit modal
  requires selecting a parent Vertical.
- **Defaults**: manage auto-assignment rules for verticals, horizontals, client locations,
  and delivery locations.
- **Field config**: configure how `id1`/`id2` fields are labeled, typed, prefixed, and
  whether they are displayed on the dashboard. The fiscal year cycle is also configurable
  in the Defaults tab.
- **System settings**: the `SystemSetting` key/value store exists in the data model and server
  actions, but no admin UI tab is currently exposed for it.
- **Preferences (admin tab)**: admins can configure the system-wide default ACV format and
  date display format, with live previews.
- **Drag-to-reorder** for lookup `displayOrder` via DnD-kit.
- **Search/filter within each admin tab** and **collapsible admin sidebar**.

### 3.6 User Preferences

Accessible from the navbar avatar popover:
- Avatar, theme (`light`/`dark`/`system`, synced via `next-themes`),
- ACV display unit, decimals, and currency preference,
- Date format,
- Custom sort order for lookups (drag-and-drop, persisted as JSON),
- Status message and online status indicator (`ONLINE`/`BUSY`/`AWAY`/`OFFLINE`).

---

## 4. Data Model (summary)

Full schema lives in `prisma/schema.prisma`.

- **User** — with `role`, manager self-relation, teams, and preference columns
  (`preferenceTheme`, `preferenceDateFormat`, `preferenceAcvUnit`, `preferenceAcvDecimals`,
  `preferenceCurrency`, `preferenceSortOrder`, `statusMessage`, `statusIndicator`).
- **Team** — functional team (Pricing, Solution, Sales, …).
- **PricingActivity** — central entity; links vertical/optional sub-vertical/horizontal/status/category/version/
  outcome, client+delivery locations (M2M), creator, team members, comments. Financial fields
  include `annualContractValue` (ACV), optional `tcv` (Total Contract Value), and optional
  `dealDuration` (months).
- **ActivityTeamMember** — join (activity, user, team).
- **Comment** — on an activity, by a user (cascade-deleted with activity).
- **Attachment** — file metadata keyed by `id1`; stored on disk.
- **Lookup tables** — Vertical, **Subvertical** (with required `verticalId` parent), Horizontal, Location, Status, Category, Version, Outcome,
  DocumentType, and **SalesforceStage** (with `description` and numeric `display` 1–10).
- **DefaultAssignment** — auto-assignment rules (type, optional referenceId, user).
- **FieldConfig** — per-field configuration for `id1` and `id2` (label, type, prefix, dashboard
  visibility). Fiscal year cycle is also configured via this mechanism in the Defaults tab.
- **SystemSetting** — global key/value store (currently unused by the UI).

---

## 5. Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4, shadcn/ui (Radix), `next-themes`, Framer Motion |
| Forms | React Hook Form + Zod |
| Server state | TanStack Query |
| Data | Prisma ORM + SQLite (dev); server actions for mutations/reads |
| Storage | Local filesystem (`storage/uploads/`) |
| Testing | Playwright (e2e) |
| Tooling | ESLint, `tsx` for seed scripts |

---

## 6. Project Layout

```
app/                # App Router pages
  login/            # email login page
  dashboard/        # SSR dashboard + admin route
    activity/new/   # create-activity full page
    activity/[id]/  # edit-activity full page
    admin/          # admin panel
  api/storage/[id]/ # file download route
components/         # feature components (dashboard, activity-form, admin-panel, ...)
hooks/              # custom hooks (activity grouping, comments, storage, ...)
lib/actions/        # server actions (auth, activity, admin, user, storage, defaults, ...)
lib/                # db client, schemas, constants, utils
prisma/             # schema, migrations, seed scripts
types/              # centralized domain/forms/api/shared type definitions
tests/e2e/          # Playwright specs
```

---

## 7. Configuration & Setup

- **Env**: `DATABASE_URL="file:./dev.db"` (see `.env`).
- **Setup**: `npx prisma generate && npx prisma db push && npx prisma db seed`.
- **Run**: `npm run dev` → http://localhost:3000.
- **Login**: any seeded user email, or `admin@example.com` / `manager@example.com` (auto-provisioned).
- **Scripts**: `dev`, `build`, `start`, `lint`.

---

## 8. Known Limitations & Production Gaps

These are deliberate current-scope trade-offs or gaps that remain after the latest audit — see §10 for the improvement backlog.

- **Auth is a prototype**: no passwords, no MFA. The session cookie is now HMAC-signed, but it still stores role/user data client-side and relies on a shared secret.
- **SQLite + local file storage** — fine for one team, not for scale or HA.
- **No automated migrations in CI** — schema changes are applied via `db push`/`migrate dev`.
- **Single-tenant** — no org isolation.
- **No external integrations** — Salesforce IDs are captured as strings only.
- **READ_ONLY role is not fully enforced** — `READ_ONLY` users are blocked from the submit button in forms, but the server actions and dashboard visibility do not explicitly narrow them to view-only.
- **File downloads are authenticated but not authorized** — `/api/storage/[id]` checks login, but does not verify that the user belongs to the activity sharing the attachment's `id1`.

---

## 9. Internal Engineering Guides

Contributors must follow the two evergreen guides in this folder:

- [`STYLE_GUIDE.md`](./STYLE_GUIDE.md) — file/folder naming conventions.
- [`REFACTOR_GUIDE.md`](./REFACTOR_GUIDE.md) — component size, hook extraction, server/client split, TypeScript and a11y rules.

---

## 10. Improvement Backlog

Concrete, verified opportunities after the full-project audit:

1. **READ_ONLY enforcement** — narrow `READ_ONLY` users to view-only in server actions, dashboard visibility, and admin actions. The form currently disables the submit button, but the server-side authorization checks are not role-aware for this case.
2. **Storage route authorization** — extend `/api/storage/[id]` to verify that the authenticated user is part of an activity sharing the attachment's `id1`, not merely logged in.
3. **Project name filter** — PRD §3.4 claims project-name filtering is available, but the dashboard search only filters `clientName`, `id1`, and `id2`. Add a dedicated project-name filter or include `projectName` in search.
4. **Inline version update** — PRD §3.2 says both status and version can be edited inline from the dashboard row. Only status is inline-editable today; version changes require opening the full edit form.
5. **Team sort-order UI** — the `preferenceSortOrder` data model supports `team`, and the dashboard applies it, but the preferences modal only exposes verticals, horizontals, and locations.
6. **System settings UI** — the `SystemSetting` table and server actions exist, but the `SettingsTab` component is imported in `admin-panel.tsx` and never rendered. Either expose it or remove the dead code.
7. **Outcome naming consistency** — PRD and seed data currently disagree on outcome labels (`Win` vs `Won`, `Loss` vs `Lost`, `No Bid` vs `Dropped`). Decide on canonical labels and align code, seed, and PRD.
8. **`id2` schema optionality** — PRD says `id2` is optional, but `schema.prisma` defines it as `String` (non-nullable). Update the schema to `String?` or keep the current UI-only optionality and document it.
9. **Fiscal field config scope** — PRD §3.5 implies fiscal fields are configurable like `id1`/`id2`, but the `FieldConfig` model only targets `id1`/`id2`. Clarify or extend fiscal configuration.
10. **Lint warnings** — `npm run lint` passes (0 errors) but reports ~89 warnings, including `no-explicit-any` patterns, unused variables, and React Hook dependency warnings. Clean up high-signal warnings.
11. **Test coverage** — only 2 e2e specs (filters). No unit tests, no component tests, no auth/admin coverage.
12. **Storage abstraction** — abstract the file backend behind an interface so S3/other providers can be swapped in.
13. **Migration hygiene** — squash the add/remove `isVisible` migration pair; consider a managed Postgres for production.
14. **Dead/duplicate code** — `types/shared/field-config.ts` vs `types/domain/config.ts`; stale one-off scripts in `scripts/`; dead `SettingsTab`.
15. **Tracked SQLite database** — `prisma/dev.db` is tracked in git; a binary database should be gitignored and generated locally.
