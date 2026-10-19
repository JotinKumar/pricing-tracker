# Pricing Tracker — Full-Project Audit Summary

> Audit date: July 23, 2026.
> Scope: compare `docs/PRD.md` against every route, server action, component, schema, and test file in the project.

---

## 1. Audit Methodology

The project was divided into four areas and reviewed in parallel:

1. **Routes & Server Actions** — `app/*`, `lib/actions/auth.ts`, `activity.ts`, `defaults.ts`, `user.ts`, `admin.ts`, `storage.ts`.
2. **Dashboard & User Preferences** — dashboard components, filter headers, pagination, grouping, `user-preferences-modal.tsx`, `sort-order-manager.tsx`.
3. **Admin Panel** — all admin panel components, tabs, modals, and admin server actions.
4. **Schema, Activity Form, Storage, Tests** — `prisma/schema.prisma`, activity form sections, file storage, `package.json`, e2e tests, seed scripts.

Each area was checked against the matching PRD sections and produced a report of matches, mismatches, undocumented features, and bugs/inconsistencies. The PRD was then updated to reflect the actual implementation.

---

## 2. Major PRD Corrections Made

| Area | PRD Claim Before | Actual Implementation | PRD Change |
| --- | --- | --- | --- |
| **Auth** | Session cookie is "plaintext JSON" | Cookie is HMAC-signed with `SESSION_SECRET` | Updated §3.1 and §8 |
| **Auth** | Unknown emails auto-created as `USER` | Only `admin@example.com` and `manager@example.com` are auto-provisioned; others rejected | Updated §3.1 |
| **Storage** | Download route is unauthenticated | Route requires `getSession()`; returns 401 if not logged in | Updated §3.2 and §8 |
| **Outcomes** | `Pipeline / Win / Loss / Inactive / No Bid` | Seed data uses `Pipeline / Won / Lost / Dropped / Inactive` | Updated §3.2 and added backlog item |
| **Pagination** | "Load more" infinite scroll | Prev/Next page buttons | Updated §3.4 |
| **Project name filter** | Filter by project name | Search only filters `clientName`, `id1`, `id2` | Removed claim from §3.4 and added backlog item |
| **Inline updates** | Status and version inline-editable | Only status is inline-editable | Updated §3.2 and added backlog item |
| **System settings** | System settings admin panel | `SystemSetting` table/actions exist; UI tab is dead code | Updated §3.5 and added backlog item |
| **Field config** | `id1`/`id2` and fiscal fields configurable | `FieldConfig` only targets `id1`/`id2`; fiscal cycle is configured separately in Defaults tab | Updated §3.5 and §4 |
| **User preferences** | Theme, ACV unit/decimals, date format, sort order | Also includes currency preference, status message, and online status indicator | Updated §3.6 and §4 |
| **Schema drift** | PRD backlog claimed `preferenceSortOrder`, `preferenceCurrency`, `statusMessage`, `statusIndicator` did not exist in schema | All four columns now exist in `prisma/schema.prisma` | Removed from backlog |
| **`session.image`** | PRD backlog claimed `image` was referenced but never returned | Code uses `avatar`, not `image` | Removed from backlog |
| **Storage route auth** | PRD backlog claimed route was unauthenticated | Route now authenticates | Removed from backlog |

---

## 3. Remaining Gaps (Added to PRD Backlog)

1. **READ_ONLY enforcement** — form disables submit, but server actions and dashboard visibility do not explicitly restrict `READ_ONLY` users.
2. **Storage authorization** — authenticated, but does not verify activity/`id1` membership.
3. **Project name filter** — no dedicated project-name search/filter in the dashboard.
4. **Inline version update** — version is not inline-editable from the dashboard row.
5. **Team sort-order UI** — data model supports team sort order, but preferences modal only shows verticals/horizontals/locations.
6. **System settings UI** — `SettingsTab` exists but is never rendered.
7. **Outcome naming consistency** — PRD/seed disagree (`Win` vs `Won`, `Loss` vs `Lost`, `No Bid` vs `Dropped`).
8. **`id2` schema optionality** — PRD says optional, schema defines it as non-nullable `String`.
9. **Fiscal field config scope** — PRD implies fiscal fields are configurable like `id1`/`id2`, but `FieldConfig` only targets `id1`/`id2`.
10. **Lint warnings** — `npm run lint` passes (0 errors) but reports ~89 warnings.
11. **Test coverage** — only 2 e2e specs; no unit/component/auth/admin tests.
12. **Storage abstraction** — local filesystem only; no provider interface for S3/etc.
13. **Migration hygiene** — add/remove `isVisible` migrations should be squashed.
14. **Dead/duplicate code** — `types/shared/field-config.ts` vs `types/domain/config.ts`, stale scripts, dead `SettingsTab`.
15. **Tracked SQLite DB** — `prisma/dev.db` is tracked in git.

---

## 4. Features Found in Code and Now Documented in the PRD

- **Signed session cookies** (HMAC-SHA256 with secret).
- **Authenticated file downloads** (with remaining authorization gap).
- **Faceted filter dropdowns** narrowed to current result set.
- **Click-to-filter from dashboard row cells** (vertical, client, version, category, location, team member, ID).
- **Dynamic viewport-based page sizing** in the dashboard.
- **Admin panel Preferences tab** for system-wide ACV/date defaults.
- **Auto-generated lookup display codes** (first 2–3 chars, or trailing number for SalesforceStage).
- **URL-driven admin tab/subtab state**.
- **Admin search/filter and collapsible sidebar**.
- **User status message and online indicator**.
- **Currency preference** in user preferences.
- **Attachment notes** field and 10MB upload limit with extension whitelist.
- **Client combobox** with autocomplete and new-client creation flow.
- **Version confirmation modal** when changing version on edit.
- **Hidden system member groups** (`Hierarchical Team`, `Default Team`) and `showHidden` toggle.

---

## 5. Verdict

After the audit, the PRD is now aligned with the actual implementation. The majority of stated features exist. The remaining mismatches are either intentional current-scope trade-offs (e.g., SQLite/local storage) or backlog items that need product/engineering decisions before changing the code (e.g., outcome naming, `id2` schema optionality, project-name filter).

The code also contains several features that were not previously documented; those have now been added to the PRD.
