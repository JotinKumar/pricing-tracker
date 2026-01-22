'use server'

import prisma from '../db'
import { getSession } from './auth'
import { activitySchema } from '../schemas'

export async function submitActivity(data: unknown) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    // Validate Input
    const parseResult = activitySchema.safeParse(data)
    if (!parseResult.success) {
        return { success: false, message: parseResult.error.issues[0].message }
    }

    const validData = parseResult.data

    try {
        const isEdit = !!validData.id
        const locationOperator = isEdit ? 'set' : 'connect'

        // Handle Team Members with Diff Logic ("Validate & Update")
        if (isEdit) {
            // 1. Fetch existing members
            const existingMembers = await prisma.activityTeamMember.findMany({
                where: { activityId: validData.id }
            })

            // 2. Filter incoming valid members
            const incomingMembers = validData.teamMembers
                .filter((tm: any) => tm.teamId && tm.userId && tm.teamId > 0 && tm.userId > 0)

            // 3. Identify members to delete (present in DB but not in incoming)
            // We use a composite key "teamId-userId" for comparison
            const incomingKeys = new Set(incomingMembers.map((tm: any) => `${tm.teamId}-${tm.userId}`))
            const membersToDelete = existingMembers.filter(
                em => !incomingKeys.has(`${em.teamId}-${em.userId}`)
            )

            if (membersToDelete.length > 0) {
                await prisma.activityTeamMember.deleteMany({
                    where: {
                        id: { in: membersToDelete.map(m => m.id) }
                    }
                })
            }

            // 4. Identify members to add (present in incoming but not in DB)
            const existingKeys = new Set(existingMembers.map(em => `${em.teamId}-${em.userId}`))
            const membersToAdd = incomingMembers.filter(
                (tm: any) => !existingKeys.has(`${tm.teamId}-${tm.userId}`)
            )

            // 5. Create new members
            if (membersToAdd.length > 0) {
                await prisma.activityTeamMember.createMany({
                    data: membersToAdd.map((tm: any) => ({
                        activityId: validData.id!,
                        teamId: tm.teamId,
                        userId: tm.userId
                    }))
                })
            }
        }

        // Ensure the payload doesn't try to create them again if 'create' was left in.
        // We handle creation for Edit mode purely above.
        // For Create mode (isEdit false), we construct the payload below.

        const teamMemberPayload: any = {}
        if (!isEdit) {
            teamMemberPayload.create = validData.teamMembers
                .filter((tm: any) => tm.teamId && tm.userId && tm.teamId > 0 && tm.userId > 0)
                .map((tm: any) => ({
                    teamId: tm.teamId,
                    userId: tm.userId
                }))
        }


        const flatPayload: any = {
            id1: validData.id1, // Renamed from salesForceId
            id2: validData.id2 || '', // Renamed from dsrNumber
            clientName: validData.clientName,
            projectName: validData.projectName,
            vertical: { connect: { id: parseInt(validData.verticalId) } },
            horizontal: validData.horizontalId ? { connect: { id: parseInt(validData.horizontalId) } } : undefined,
            status: validData.statusId ? { connect: { id: parseInt(validData.statusId) } } : undefined,
            category: validData.categoryId ? { connect: { id: parseInt(validData.categoryId) } } : undefined,
            version: validData.versionId ? { connect: { id: parseInt(validData.versionId) } } : undefined,

            annualContractValue: validData.annualContractValue,
            dueDate: new Date(validData.dueDate).toISOString(),

            clientLocations: { [locationOperator]: validData.clientLocationIds.map((id) => ({ id })) },
            deliveryLocations: { [locationOperator]: validData.deliveryLocationIds.map((id) => ({ id })) },

            teamMembers: teamMemberPayload,

            assignDate: validData.assignDate ? new Date(validData.assignDate).toISOString() : new Date().toISOString(),
        }

        // Handle Comments (New Comment)
        if (validData.newComment && validData.newComment.trim().length > 0) {
            flatPayload.comments = {
                create: {
                    text: validData.newComment,
                    userId: session.id
                }
            }
        }

        // Fix: Status is likely required in DB? logic usually sets default.
        // If statusId is missing, we might fail. Schema says optional?
        // Let's assume passed validData has it if form requires it.
        // But better to be safe. If statusId is present:
        if (validData.statusId) flatPayload.status = { connect: { id: parseInt(validData.statusId) } }

        const dataWithOutcome: any = { ...flatPayload }

        if (validData.outcomeId) {
            dataWithOutcome.outcome = { connect: { id: parseInt(validData.outcomeId) } }
        } else {
            if (isEdit) {
                dataWithOutcome.outcome = { disconnect: true }
            }
        }

        // Clean up undefined Keys to avoid "connect: undefined" errors if Prisma checks strict
        Object.keys(dataWithOutcome).forEach(key => dataWithOutcome[key] === undefined && delete dataWithOutcome[key])

        const includeRelations = {
            vertical: true,
            horizontal: true,
            clientLocations: true,
            deliveryLocations: true,
            status: true,
            category: true,
            version: true,
            user: {
                include: {
                    teams: true,
                    manager: true
                }
            },
            teamMembers: {
                include: {
                    team: true,
                    user: true
                }
            },
            outcome: true,
            comments: {
                include: {
                    user: true
                },
                orderBy: { createdAt: 'desc' as const }
            }
        }

        let activity;
        if (isEdit) {
            activity = await prisma.pricingActivity.update({
                where: { id: validData.id },
                data: dataWithOutcome,
                include: includeRelations
            })
        } else {
            activity = await prisma.pricingActivity.create({
                data: {
                    ...dataWithOutcome,
                    user: { connect: { id: session.id } }
                },
                include: includeRelations
            })
        }

        return { success: true, activity }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Failed to save activity: ' + (error instanceof Error ? error.message : String(error)) }
    }
}

export async function getActivities(params: {
    page?: number
    limit?: number
    search?: string
    viewMode?: 'pipeline' | 'closed' | 'inactive'
    filters?: Record<string, string>
}) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit
    const search = params.search || ''
    const viewMode = params.viewMode || 'pipeline'
    const filters = params.filters || {}

    const where: any = {}

    // Role-based Access
    if (session.role !== 'ADMIN') {
        if (!where.AND) where.AND = [];
        where.AND.push({
            OR: [
                { userId: session.id },
                { teamMembers: { some: { userId: session.id } } }
            ]
        });
    }

    // Text Search - Updated for id1 (SF) and id2 (DSR)
    if (search) {
        where.OR = [
            { clientName: { contains: search } },
            { projectName: { contains: search } },
            { id1: { contains: search } },
            { id2: { contains: search } }
        ]
    }

    // View Mode Logic
    if (viewMode === 'pipeline') {
        where.OR = [
            { outcome: { is: null } },
            { outcome: { outcome: 'Pipeline' } }
        ]
        if (search) {
            where.AND = [
                { OR: where.OR },
                {
                    OR: [
                        { clientName: { contains: search } },
                        { projectName: { contains: search } },
                        { id1: { contains: search } },
                        { id2: { contains: search } }
                    ]
                }
            ]
            delete where.OR
        }
    } else if (viewMode === 'closed') {
        where.outcome = { outcome: { in: ['Win', 'Loss'] } }
    } else if (viewMode === 'inactive') {
        where.outcome = { outcome: { in: ['Inactive', 'No Bid'] } }
    }

    // Filter Logic
    if (!where.AND) where.AND = []

    Object.entries(filters).forEach(([key, value]) => {
        if (!value || value === 'all') return

        if (key.startsWith('team_')) {
            const teamName = key.replace('team_', '')
            if (value === 'Unassigned') {
                where.AND.push({
                    teamMembers: {
                        none: {
                            team: { teamname: teamName }
                        }
                    }
                })
            } else {
                where.AND.push({
                    teamMembers: {
                        some: {
                            team: { teamname: teamName },
                            user: { name: value }
                        }
                    }
                })
            }
        } else if (key === 'clientLocationIds') {
            where.clientLocations = { some: { id: parseInt(value) } }
        } else if (key === 'deliveryLocationIds') {
            where.deliveryLocations = { some: { id: parseInt(value) } }
        } else if (key === 'verticalId') where.verticalId = parseInt(value)
        else if (key === 'statusId') where.statusId = parseInt(value)
        else if (key === 'versionId') where.versionId = parseInt(value)
        else if (key === 'clientName') where.clientName = value
        else if (key === 'projectName') where.projectName = value
        else if (key === 'annualContractValue') where.annualContractValue = parseInt(value)
    })

    if (where.AND.length === 0) delete where.AND

    try {
        const [activities, totalCount] = await Promise.all([
            prisma.pricingActivity.findMany({
                where,
                include: {
                    vertical: true,
                    horizontal: true,
                    clientLocations: true,
                    deliveryLocations: true,
                    status: true,
                    category: true,
                    version: true,
                    user: {
                        include: {
                            teams: true,
                            manager: true
                        }
                    },
                    teamMembers: {
                        include: {
                            team: true,
                            user: true
                        }
                    },
                    outcome: true,
                    comments: {
                        include: { user: true },
                        orderBy: { createdAt: 'desc' as const }
                    }
                },
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' }
            }),
            prisma.pricingActivity.count({ where })
        ])

        // Fetch attachment counts - Updated to use id1 (assuming attachment links to id1 now?)
        // Schema for Attachment still says 'salesForceId String'. 
        // We verified earlier Attachment schema has 'salesForceId'.
        // If the activity uses 'id1' (which IS salesForceId), we can still join on it if the logic holds.
        // But the attachment table schema might need update if we renamed it everywhere?
        // Step 546 showed Schema has 'salesForceId String' in Attachment.
        // And 'id1 String' in PricingActivity.
        // So they match by value.
        const sfIds = activities.map(a => a.id1).filter(Boolean)
        const attachmentCounts = await prisma.attachment.groupBy({
            by: ['salesForceId'],
            where: {
                salesForceId: { in: sfIds }
            },
            _count: {
                salesForceId: true
            }
        })

        const countMap = new Map(attachmentCounts.map(ac => [ac.salesForceId, ac._count.salesForceId]))

        const activitiesWithCounts = activities.map(activity => ({
            ...activity,
            attachmentCount: countMap.get(activity.id1) || 0
        }))

        return {
            success: true,
            data: activitiesWithCounts,
            metadata: {
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        }
    } catch (error) {
        console.error("Error fetching activities:", error)
        return { success: false, message: 'Failed to fetch activities' }
    }
}
