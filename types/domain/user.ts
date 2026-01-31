import { Prisma } from '@prisma/client'

export type User = Prisma.UserGetPayload<{
    include: { teams: true, manager: true }
}>

export type Team = Prisma.TeamGetPayload<{ include: { users: true } }>

export interface UserSession {
    id: number
    role: string
    name: string
    email: string
    image?: string | null
    avatar?: string | null
    preferenceTheme?: string | null
    preferenceCurrency?: string | null
    preferenceDateFormat?: string | null
    preferenceAcvUnit?: string | null
    preferenceAcvDecimals?: string | null
}
