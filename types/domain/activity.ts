import { Prisma } from '@prisma/client'

export type ActivityHistory = Prisma.ActivityHistoryGetPayload<{
    include: {
        version: true
        status: true
        outcome: true
        user: true
    }
}>

export type PricingActivity = Prisma.PricingActivityGetPayload<{
    include: {
        vertical: true
        subvertical: true
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
        },
        comments: {
            include: {
                user: true
            }
        }
    }
}> & { attachmentCount?: number }

export type PricingActivityWithHistory = PricingActivity & {
    history: ActivityHistory[]
}

export type Comment = Prisma.CommentGetPayload<{
    include: { user: true }
}>

export type ActivityTeamMember = Prisma.ActivityTeamMemberGetPayload<{
    include: { team: true, user: true }
}>

export type ExtendedActivity = PricingActivity
