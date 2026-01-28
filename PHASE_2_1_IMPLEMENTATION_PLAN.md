# Phase 2.1: Critical Type Safety - Implementation Plan

## Executive Summary

This plan establishes a centralized type system to eliminate 25 `any` type violations (12 in AdminModal.tsx, 13 in ActivityForm.tsx) and improve compile-time type safety across the codebase. No runtime type guards will be implemented as per requirements.

---

## 1. New File Structure

```
types/
├── index.ts                    # Re-exports all types
├── domain/
│   ├── index.ts               # Re-exports domain types
│   ├── user.ts                # User, UserSession types
│   ├── activity.ts            # PricingActivity, ActivityTeamMember, Comment types
│   └── lookups.ts             # Lookup table types (Vertical, Horizontal, Location, etc.)
├── forms/
│   ├── index.ts               # Re-exports form types
│   ├── activity.ts            # Activity form value types
│   └── admin.ts               # Admin form value types
└── api/
    ├── index.ts               # Re-exports API types
    ├── admin.ts               # Admin API request/response types
    └── activity.ts            # Activity API request/response types
```

---

## 2. Detailed Type File Contents

### 2.1 types/domain/user.ts

```typescript
import { Prisma } from '@prisma/client'

/**
 * User domain type with full relations
 * Used for admin panel and user management
 */
export type User = Prisma.UserGetPayload<{
    include: { teams: true; manager: true }
}>

/**
 * Simplified user type for dropdowns and selections
 */
export interface UserOption {
    id: number
    name: string
    initials?: string | null
    avatar?: string | null
}

/**
 * User session from authentication
 */
export interface UserSession {
    id: number
    role: 'ADMIN' | 'MANAGER' | 'USER' | 'READ_ONLY'
    name: string
}

/**
 * Team with users relation
 */
export type Team = Prisma.TeamGetPayload<{ include: { users: true } }>

/**
 * Simplified team type for dropdowns
 */
export interface TeamOption {
    id: number
    teamname: string
    display?: string | null
}
```

### 2.2 types/domain/activity.ts

```typescript
import { Prisma } from '@prisma/client'

/**
 * Main PricingActivity domain type with all relations
 */
export type PricingActivity = Prisma.PricingActivityGetPayload<{
    include: {
        vertical: true
        horizontal: true
        clientLocations: true
        deliveryLocations: true
        status: true
        category: true
        version: true
        user: true
        outcome: true
        teamMembers: {
            include: {
                team: true
                user: true
            }
        }
        comments: {
            include: {
                user: true
            }
        }
    }
}> & { attachmentCount?: number }

/**
 * ActivityTeamMember with relations
 */
export type ActivityTeamMember = Prisma.ActivityTeamMemberGetPayload<{
    include: {
        team: true
        user: true
    }
}>

/**
 * Comment with user relation
 */
export type Comment = Prisma.CommentGetPayload<{
    include: {
        user: true
    }
}>

/**
 * Simplified team member for form handling
 */
export interface TeamMemberInput {
    teamId: number
    userId: number
}

/**
 * Simplified comment for form handling
 */
export interface CommentInput {
    id?: number
    text: string
    userId: number
    createdAt?: Date
}
```

### 2.3 types/domain/lookups.ts

```typescript
/**
 * Base lookup item interface
 * All lookup tables share these fields
 */
export interface LookupItem {
    id: number
    display?: string | null
    isActive: boolean
}

/**
 * Vertical lookup
 */
export interface Vertical extends LookupItem {
    vertical: string
}

/**
 * Horizontal lookup
 */
export interface Horizontal extends LookupItem {
    horizontal: string
}

/**
 * Location lookup with currency
 */
export interface Location extends LookupItem {
    country: string
    currency?: string | null
}

/**
 * Status lookup
 */
export interface Status extends LookupItem {
    status: string
}

/**
 * Category lookup
 */
export interface Category extends LookupItem {
    category: string
}

/**
 * Version lookup
 */
export interface Version extends LookupItem {
    version: string
}

/**
 * Outcome lookup
 */
export interface Outcome extends LookupItem {
    outcome: string
}

/**
 * Document type lookup
 */
export interface DocumentType extends LookupItem {
    type: string
}

/**
 * Aggregated lookups object passed to forms
 */
export interface Lookups {
    verticals: Vertical[]
    horizontals: Horizontal[]
    locations: Location[]
    statuses: Status[]
    categories: Category[]
    versions: Version[]
    outcomes: Outcome[]
    teams: import('./user').Team[]
    users: import('./user').User[]
}
```

### 2.4 types/forms/activity.ts

```typescript
/**
 * Form values for activity creation/editing
 * Mirrors the Zod schema in lib/schemas.ts
 */
export interface ActivityFormValues {
    id?: number
    id1: string
    id2?: string
    clientName: string
    projectName: string
    verticalId: string
    horizontalId?: string
    annualContractValue: number
    dueDate: Date | string
    clientLocationIds: number[]
    deliveryLocationIds: number[]
    teamMembers: Array<{
        teamId: number
        userId: number
    }>
    assignDate?: Date | string
    statusId?: string
    categoryId?: string
    versionId?: string
    outcomeId?: string
    newComment?: string
    isActive: boolean
}

/**
 * Partial form values for initialization
 */
export type PartialActivityFormValues = Partial<ActivityFormValues>
```

### 2.5 types/forms/admin.ts

```typescript
import { UserRole } from '../api/admin'

/**
 * Form values for user creation/editing
 */
export interface AdminUserFormValues {
    id?: number
    email: string
    name?: string
    firstName?: string
    lastName?: string
    initials?: string
    designation?: string
    avatar?: string
    managerId?: number
    role: UserRole
    teams: number[]
    isActive: boolean
}

/**
 * Form values for lookup table creation/editing
 * Uses dynamic field for the primary value
 */
export interface AdminLookupFormValues {
    id?: number
    display?: string
    isActive: boolean
    currency?: string
    [key: string]: string | number | boolean | undefined
}

/**
 * Field configuration for admin modal
 */
export interface AdminFieldConfig {
    key: string
    label: string
}
```

### 2.6 types/api/admin.ts

```typescript
import { User, Team } from '../domain/user'
import { Vertical, Horizontal, Location, Status, Category, Version, Outcome, DocumentType } from '../domain/lookups'

/**
 * Admin data types supported by the system
 */
export type AdminDataType = 
    | 'User' 
    | 'Team' 
    | 'Vertical' 
    | 'Horizontal' 
    | 'Location' 
    | 'Status' 
    | 'Category' 
    | 'Version' 
    | 'Outcome' 
    | 'DocumentType'

/**
 * User roles
 */
export type UserRole = 'USER' | 'MANAGER' | 'ADMIN' | 'READ_ONLY'

/**
 * Union type for all admin data entities
 */
export type AdminData = 
    | User 
    | Team 
    | Vertical 
    | Horizontal 
    | Location 
    | Status 
    | Category 
    | Version 
    | Outcome 
    | DocumentType

/**
 * API response for getAdminData
 */
export interface GetAdminDataResponse<T = AdminData> {
    success: boolean
    data?: T[]
    message?: string
}

/**
 * API response for saveAdminData
 */
export interface SaveAdminDataResponse {
    success: boolean
    errors?: Record<string, string>
    message?: string
}

/**
 * API response for deleteAdminData
 */
export interface DeleteAdminDataResponse {
    success: boolean
    message?: string
}

/**
 * Props for AdminModal component
 */
export interface AdminModalProps {
    editItem: User | null
    activeTab: AdminDataType
    fields: { key: string; label: string }
    handleSave: (data: AdminUserFormValues | AdminLookupFormValues) => Promise<SaveAdminDataResponse>
    onClose: () => void
    data: User[]
    availableTeams: Team[]
    defaultCurrency?: string
}
```

### 2.7 types/api/activity.ts

```typescript
import { PricingActivity } from '../domain/activity'

/**
 * API response for activity operations
 */
export interface ActivityApiResponse {
    success: boolean
    activity?: PricingActivity
    message?: string
}

/**
 * API response for fetching unique clients
 */
export interface UniqueClientsResponse {
    success: boolean
    data?: string[]
    message?: string
}

/**
 * API response for comment operations
 */
export interface CommentApiResponse {
    success: boolean
    comment?: import('../domain/activity').Comment
    message?: string
}
```

### 2.8 types/domain/index.ts

```typescript
export * from './user'
export * from './activity'
export * from './lookups'
```

### 2.9 types/forms/index.ts

```typescript
export * from './activity'
export * from './admin'
```

### 2.10 types/api/index.ts

```typescript
export * from './admin'
export * from './activity'
```

### 2.11 types/index.ts (main entry point)

```typescript
// Domain types
export * from './domain'

// Form types
export * from './forms'

// API types
export * from './api'
```

---

## 3. Step-by-Step Migration Instructions

### 3.1 AdminModal.tsx Migration (12 any violations)

**Current violations:**
- Line 17: `editItem: any`
- Line 20: `handleSave: (data: any) => Promise<any>`
- Line 22: `data: any[]`
- Line 23: `availableTeams?: any[]`
- Line 50: `teams: editItem?.teams?.map((t: any) => t.id) || []`
- Line 57: `useForm<any>`
- Line 87: `data.some((item: any) => ...)`
- Line 93: `useState<any>(null)`
- Line 97: `onSubmit = async (data: any)`
- Line 130: `processSave = async (data: any)`
- Line 134: `key as any`
- Line 380: `data.filter((u: any) => ...)`

**Migration steps:**

1. **Update imports (Line 1-14):**
```typescript
import { AdminModalProps, AdminUserFormValues, AdminLookupFormValues, User } from '@/types'
```

2. **Replace AdminModalProps interface (Lines 16-25):**
```typescript
// Use imported type instead of inline definition
// Remove the entire interface block - use AdminModalProps from '@/types'
```

3. **Update function signature (Line 27):**
```typescript
export function AdminModal({ 
    editItem, 
    activeTab, 
    fields, 
    handleSave, 
    onClose, 
    data, 
    availableTeams = [], 
    defaultCurrency = '$' 
}: AdminModalProps) {
```

4. **Fix teams mapping (Line 50):**
```typescript
// Change from:
teams: editItem?.teams?.map((t: any) => t.id) || []
// To:
teams: editItem?.teams?.map((t) => t.id) || []
```

5. **Fix useForm type (Line 57):**
```typescript
// Change from:
const form = useForm<any>({
// To:
const form = useForm<AdminUserFormValues | AdminLookupFormValues>({
```

6. **Fix data filtering (Line 87):**
```typescript
// Change from:
const isCollision = (val: string) => data.some((item: any) => item.id !== editItem?.id && item.display === val)
// To:
const isCollision = (val: string) => data.some((item) => item.id !== editItem?.id && item.display === val)
```

7. **Fix pendingData state (Line 93):**
```typescript
// Change from:
const [pendingData, setPendingData] = useState<any>(null)
// To:
const [pendingData, setPendingData] = useState<AdminUserFormValues | AdminLookupFormValues | null>(null)
```

8. **Fix onSubmit handler (Line 97):**
```typescript
// Change from:
const onSubmit = async (data: any) => {
// To:
const onSubmit = async (data: AdminUserFormValues | AdminLookupFormValues) => {
```

9. **Fix processSave handler (Line 130):**
```typescript
// Change from:
const processSave = async (data: any) => {
// To:
const processSave = async (data: AdminUserFormValues | AdminLookupFormValues) => {
```

10. **Fix form.setError type (Line 134):**
```typescript
// Change from:
form.setError(key as any, { type: 'manual', message: message as string })
// To:
form.setError(key as keyof (AdminUserFormValues | AdminLookupFormValues), { 
    type: 'manual', 
    message: message as string 
})
```

11. **Fix user filtering in Select (Line 380):**
```typescript
// Change from:
{data.filter((u: any) => u.id !== editItem?.id).map((u: any) => (
// To:
{data.filter((u) => u.id !== editItem?.id).map((u) => (
```

### 3.2 ActivityForm.tsx Migration (13 any violations)

**Current violations:**
- Line 56: `(activity as any)?.id1`
- Line 57: `(activity as any)?.id2`
- Line 61: `lookups.horizontals?.find((h: any) => ...)`
- Line 63: `as any` on date
- Line 66: `activity?.clientLocations?.map((l: any) => ...)`
- Line 67: `activity?.deliveryLocations?.map((l: any) => ...)`
- Line 70: `(activity as any)?.teamMembers?.map((tm: any) => ...)`
- Line 75: `as any` on date
- Line 79: `lookups.outcomes?.find((o: any) => ...)`
- Line 85: `as any` on zodResolver
- Line 146: `useState<any[]>`
- Line 183: `(activity as any)?.comments`

**Migration steps:**

1. **Update imports (Line 16-17):**
```typescript
import { PricingActivity, Lookups, UserSession, ActivityFormValues, TeamMemberInput, Comment } from '@/types'
```

2. **Fix activity field access (Lines 56-57):**
```typescript
// Change from:
id1: (activity as any)?.id1 || (activity as any)?.salesForceId || '',
id2: (activity as any)?.id2 || (activity as any)?.dsrNumber || '',
// To (remove legacy field fallbacks per requirements):
id1: activity?.id1 || '',
id2: activity?.id2 || '',
```

3. **Fix horizontals find (Line 61):**
```typescript
// Change from:
horizontalId: String(activity?.horizontalId || lookups.horizontals?.find((h: any) => h.horizontal === 'Regular')?.id || lookups.horizontals?.[0]?.id || ''),
// To:
horizontalId: String(activity?.horizontalId || lookups.horizontals?.find((h) => h.horizontal === 'Regular')?.id || lookups.horizontals?.[0]?.id || ''),
```

4. **Fix date casting (Lines 63, 75):**
```typescript
// Change from:
.toISOString().split('T')[0] as any
// To:
.toISOString().split('T')[0]
```

5. **Fix location mapping (Lines 66-67):**
```typescript
// Change from:
clientLocationIds: activity?.clientLocations?.map((l: any) => l.id) || [],
deliveryLocationIds: activity?.deliveryLocations?.map((l: any) => l.id) || [],
// To:
clientLocationIds: activity?.clientLocations?.map((l) => l.id) || [],
deliveryLocationIds: activity?.deliveryLocations?.map((l) => l.id) || [],
```

6. **Fix teamMembers mapping (Lines 70-73):**
```typescript
// Change from:
teamMembers: (activity as any)?.teamMembers?.map((tm: any) => ({
    teamId: tm.teamId,
    userId: tm.userId
})) || [],
// To:
teamMembers: activity?.teamMembers?.map((tm): TeamMemberInput => ({
    teamId: tm.teamId,
    userId: tm.userId
})) || [],
```

7. **Fix outcomes find (Line 79):**
```typescript
// Change from:
outcomeId: String(activity?.outcomeId || lookups.outcomes?.find((o: any) => o.outcome === 'Pipeline')?.id || ''),
// To:
outcomeId: String(activity?.outcomeId || lookups.outcomes?.find((o) => o.outcome === 'Pipeline')?.id || ''),
```

8. **Fix zodResolver cast (Line 85):**
```typescript
// Change from:
resolver: zodResolver(activitySchema) as any,
// To:
resolver: zodResolver(activitySchema),
```

9. **Fix localComments state (Line 146):**
```typescript
// Change from:
const [localComments, setLocalComments] = useState<any[]>((activity as any)?.comments || [])
// To:
const [localComments, setLocalComments] = useState<Comment[]>((activity?.comments as Comment[]) || [])
```

10. **Fix existingComments (Line 183):**
```typescript
// Change from:
const existingComments = (activity as any)?.comments || []
// To:
const existingComments = activity?.comments || []
```

---

## 4. Import Path Updates

### Files requiring import updates:

| File | Current Import | New Import |
|------|---------------|------------|
| `components/admin-panel/admin-modal.tsx` | `import { adminUserSchema, adminLookupSchema } from '@/lib/schemas'` | Add: `import { AdminModalProps, AdminUserFormValues, AdminLookupFormValues, User } from '@/types'` |
| `components/activity-form/activity-form.tsx` | `import { Lookups, PricingActivity, UserSession } from '@/types'` | Add: `import { ActivityFormValues, TeamMemberInput, Comment } from '@/types'` |
| `lib/actions/admin.ts` | No type imports | Add: `import { AdminDataType, AdminUserFormValues, AdminLookupFormValues, SaveAdminDataResponse } from '@/types'` |
| `hooks/use-admin-data.ts` | No type imports | Add: `import { AdminDataType } from '@/types'` |
| `hooks/use-activity-grouping.ts` | `import { PricingActivity } from '@/types'` | No change (already correct) |

---

## 5. Testing Strategy

### 5.1 Pre-Migration Baseline
```bash
# Count current any violations
npx tsc --noEmit 2>&1 | grep -c "any" || echo "0"

# Run type check to establish baseline
npx tsc --noEmit
```

### 5.2 Post-Migration Verification
```bash
# Run full type check
npx tsc --noEmit

# Verify zero any violations in target files
grep -n "any" components/admin-panel/admin-modal.tsx || echo "✓ No any in AdminModal"
grep -n "any" components/activity-form/activity-form.tsx || echo "✓ No any in ActivityForm"
```

### 5.3 Functional Testing Checklist

**AdminModal.tsx:**
- [ ] Create new user with all fields
- [ ] Edit existing user
- [ ] Create lookup item (Vertical, Horizontal, etc.)
- [ ] Edit lookup item
- [ ] Validation errors display correctly
- [ ] Manager dropdown filters out current user
- [ ] Teams multi-select works
- [ ] Avatar upload works

**ActivityForm.tsx:**
- [ ] Create new activity
- [ ] Edit existing activity
- [ ] Auto-assignment triggers on vertical/horizontal change
- [ ] Client location multi-select works
- [ ] Delivery location multi-select works
- [ ] Team member assignment works
- [ ] Comments display and add correctly
- [ ] Version change confirmation appears

### 5.4 Regression Testing
```bash
# Build the application
npm run build

# Run linting
npm run lint

# Run any existing tests
npm test
```

---

## 6. Timeline and Effort Estimates

### Phase 2.1: Critical Type Safety (Total: 8-10 hours)

| Task | Estimated Time | Dependencies |
|------|---------------|--------------|
| Create type directory structure | 15 min | None |
| Write types/domain/*.ts files | 45 min | Prisma schema |
| Write types/forms/*.ts files | 30 min | Zod schemas |
| Write types/api/*.ts files | 30 min | lib/actions/*.ts |
| Create index.ts re-exports | 15 min | All type files |
| Migrate AdminModal.tsx (12 violations) | 2 hours | Type files complete |
| Migrate ActivityForm.tsx (13 violations) | 2 hours | Type files complete |
| Update lib/actions/admin.ts types | 1 hour | Type files complete |
| Update hooks/use-admin-data.ts | 30 min | Type files complete |
| Testing and verification | 2 hours | All migrations complete |
| Fix any type errors that emerge | 1 hour | Testing complete |

### Milestones:
- **M1 (Hour 2):** All type files created and exported
- **M2 (Hour 4):** AdminModal.tsx fully migrated
- **M3 (Hour 6):** ActivityForm.tsx fully migrated
- **M4 (Hour 8):** All supporting files updated
- **M5 (Hour 10):** Testing complete, zero type errors

### Risk Factors:
- **Medium Risk:** Dynamic field handling in AdminLookupFormValues may require refinement
- **Low Risk:** Date string/Date type mismatches in form values
- **Mitigation:** Keep Zod schemas as source of truth, types should mirror schemas

---

## 7. Success Criteria

1. **Zero `any` types** in AdminModal.tsx and ActivityForm.tsx
2. **Zero TypeScript errors** when running `npx tsc --noEmit`
3. **All existing functionality preserved** (manual testing checklist passes)
4. **Clean build** with `npm run build`
5. **No lint errors** related to types

---

## 8. Rollback Plan

If critical issues are discovered:
1. Revert changes to AdminModal.tsx and ActivityForm.tsx
2. Revert changes to lib/actions/admin.ts
3. Keep new types directory for future reference
4. Type files are additive and won't break existing code if not imported

---

## Appendix A: Type Compatibility Matrix

| Source | Target Type | Notes |
|--------|-------------|-------|
| `Prisma.UserGetPayload<...>` | `User` | Direct export |
| `Prisma.PricingActivityGetPayload<...>` | `PricingActivity` | Direct export with attachmentCount extension |
| `z.infer<typeof activitySchema>` | `ActivityFormValues` | Should match exactly |
| `z.infer<typeof adminUserSchema>` | `AdminUserFormValues` | Should match exactly |
| `z.infer<typeof adminLookupSchema>` | `AdminLookupFormValues` | Dynamic fields via index signature |

## Appendix B: Migration Order

1. Create all type files (no changes to existing code)
2. Migrate AdminModal.tsx
3. Migrate ActivityForm.tsx
4. Update lib/actions/admin.ts
5. Update hooks/use-admin-data.ts
6. Run full test suite
7. Fix any issues
