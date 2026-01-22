
import { Prisma } from '@prisma/client'

// Re-export Prisma types for convenience
export type User = Prisma.UserGetPayload<{
    include: { teams: true, manager: true }
}>

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
    }
}> & { attachmentCount?: number }

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
export type Team = Prisma.TeamGetPayload<{ include: { users: true } }>

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

export interface UserSession {
    id: number
    role: string
    name: string
}
