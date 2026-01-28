import { Prisma } from '@prisma/client'

export type User = Prisma.UserGetPayload<{
    include: { teams: true, manager: true }
}>

export type Team = Prisma.TeamGetPayload<{ include: { users: true } }>

export interface UserSession {
    id: number
    role: string
    name: string
}
