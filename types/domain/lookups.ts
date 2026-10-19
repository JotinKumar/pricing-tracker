export type LookupItem = {
    id: number
    display?: string | null
    isActive: boolean
    [key: string]: unknown
}

export type Vertical = LookupItem & { vertical: string }
export type Subvertical = LookupItem & { subvertical: string; verticalId: number; vertical?: Vertical }
export type Horizontal = LookupItem & { horizontal: string }
export type Location = LookupItem & { country: string }
export type Status = LookupItem & { status: string }
export type Category = LookupItem & { category: string }
export type Version = LookupItem & { version: string }
export type Outcome = LookupItem & { outcome: string }
export type SalesforceStage = LookupItem & { stage: string; description?: string | null }

export interface Lookups {
    verticals: Vertical[]
    subverticals?: Subvertical[]
    horizontals: Horizontal[]
    locations: Location[]
    statuses: Status[]
    categories: Category[]
    versions: Version[]
    outcomes: Outcome[]
    teams: Team[]
    users: User[]
}

export interface DashboardFacets {
    clients: string[]
    verticalIds: number[]
    versionIds: number[]
    categoryIds: number[]
    statusIds: number[]
    clientLocationIds: number[]
    deliveryLocationIds: number[]
    teamMembers: { team: string; user: string }[]
}

// Import these from other domain files
import type { Team, User } from './user'
