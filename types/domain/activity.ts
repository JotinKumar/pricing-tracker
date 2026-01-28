import { Prisma } from '@prisma/client'

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
        },
        comments: {
            include: {
                user: true
            }
        }
    }
}> & { attachmentCount?: number }

export type Comment = Prisma.CommentGetPayload<{
    include: { user: true }
}>

export type ActivityTeamMember = Prisma.ActivityTeamMemberGetPayload<{
    include: { team: true, user: true }
}>

export interface ExtendedActivity extends PricingActivity {
    // Additional computed fields or extensions if needed
    // Note: id1 and id2 are already defined in PricingActivity from Prisma
}
