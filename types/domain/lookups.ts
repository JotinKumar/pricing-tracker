export type LookupItem = {
    id: number
    display?: string | null
    isActive: boolean
    [key: string]: unknown
}

export type Vertical = LookupItem & { vertical: string }
export type Horizontal = LookupItem & { horizontal: string }
export type Location = LookupItem & { country: string }
export type Status = LookupItem & { status: string }
export type Category = LookupItem & { category: string }
export type Version = LookupItem & { version: string }
export type Outcome = LookupItem & { outcome: string }

export interface Lookups {
    verticals: Vertical[]
    horizontals: Horizontal[]
    locations: Location[]
    statuses: Status[]
    categories: Category[]
    versions: Version[]
    outcomes: Outcome[]
    teams: Team[]
    users: User[]
}

// Import these from other domain files
import type { Team, User } from './user'
