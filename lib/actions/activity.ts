'use server'

import prisma from '../db'
import { getSession } from './auth'
import { activitySchema } from '../schemas'
import { getUpstreamManagers, getBulkUpstreamManagers } from './user'
import { Prisma } from '@prisma/client'
import { PricingActivity } from '@/types'

type ActivityFilterParams = {
    search?: string
    viewMode?: 'pipeline' | 'closed' | 'inactive'
    filters?: Record<string, string>
}

function daysFromTodayToDate(days: number, edge: 'start' | 'end'): Date {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + days)
    if (edge === 'end') d.setHours(23, 59, 59, 999)
    return d
}

// Builds the shared Prisma where clause for activity queries.
// `excludeKeys` skips specific filter keys so a facet can ignore its own dimension.
// The token 'team_*' skips every team member filter.
function buildActivityWhere(
    session: { id: number; role: string },
    params: ActivityFilterParams,
    excludeKeys: string[] = []
): Prisma.PricingActivityWhereInput {
    const where: Prisma.PricingActivityWhereInput = {}
    const AND: Prisma.PricingActivityWhereInput[] = []
    const filters = params.filters || {}
    const search = params.search || ''
    const viewMode = params.viewMode || 'pipeline'

    if (session.role !== 'ADMIN') {
        AND.push({
            OR: [
                { userId: session.id },
                { teamMembers: { some: { userId: session.id } } }
            ]
        })
    }

    if (search) {
        where.OR = [
            { clientName: { contains: search } },
            { projectName: { contains: search } },
            { id1: { contains: search } },
            { id2: { contains: search } }
        ]
    }

    if (viewMode === 'pipeline') where.outcome = { outcome: 'Pipeline' }
    else if (viewMode === 'closed') where.outcome = { outcome: { in: ['Win', 'Loss'] } }
    else if (viewMode === 'inactive') where.outcome = { outcome: { in: ['Inactive', 'No Bid'] } }

    const excludeTeam = excludeKeys.includes('team_*')
    const acv: { gte?: number; lte?: number } = {}
    const due: { gte?: Date; lte?: Date } = {}

    Object.entries(filters).forEach(([key, value]) => {
        if (!value || value === 'all') return
        if (excludeKeys.includes(key)) return

        if (key.startsWith('team_')) {
            if (excludeTeam) return
            const teamName = key.replace('team_', '')
            if (value === 'Unassigned') {
                AND.push({ teamMembers: { none: { team: { teamname: teamName } } } })
            } else {
                AND.push({ teamMembers: { some: { team: { teamname: teamName }, user: { name: value } } } })
            }
        } else if (key === 'clientLocationIds') where.clientLocations = { some: { id: parseInt(value) } }
        else if (key === 'deliveryLocationIds') where.deliveryLocations = { some: { id: parseInt(value) } }
        else if (key === 'verticalId') where.verticalId = parseInt(value)
        else if (key === 'statusId') where.statusId = parseInt(value)
        else if (key === 'versionId') where.versionId = parseInt(value)
        else if (key === 'categoryId') where.categoryId = parseInt(value)
        else if (key === 'id1') where.id1 = value
        else if (key === 'id2') where.id2 = value
        else if (key === 'clientName') where.clientName = value
        else if (key === 'projectName') where.projectName = value
        else if (key === 'annualContractValue') where.annualContractValue = parseInt(value)
        else if (key === 'annualContractValue_min') acv.gte = parseInt(value)
        else if (key === 'annualContractValue_max') acv.lte = parseInt(value)
        else if (key === 'dueDate_days_min') due.gte = daysFromTodayToDate(parseInt(value), 'start')
        else if (key === 'dueDate_days_max') due.lte = daysFromTodayToDate(parseInt(value), 'end')
    })

    if ((acv.gte !== undefined || acv.lte !== undefined) && where.annualContractValue === undefined) {
        where.annualContractValue = acv
    }
    if (due.gte !== undefined || due.lte !== undefined) {
        where.dueDate = due
    }
    if (AND.length > 0) where.AND = AND

    return where
}

export async function submitActivity(data: unknown) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    // Validate Input
    const parseResult = activitySchema.safeParse(data)
    if (!parseResult.success) {
        return { success: false, message: parseResult.error.issues[0].message }
    }

    const validData = parseResult.data

    // Authorization: on edit, verify the user owns the activity or is admin
    if (validData.id) {
        const existing = await prisma.pricingActivity.findUnique({
            where: { id: validData.id },
            select: { userId: true, teamMembers: { select: { userId: true } } }
        })
        if (!existing) {
            return { success: false, message: 'Activity not found' }
        }
        const isOwner = existing.userId === session.id
        const isTeamMember = existing.teamMembers.some(tm => tm.userId === session.id)
        if (!isOwner && !isTeamMember && session.role !== 'ADMIN') {
            return { success: false, message: 'Forbidden' }
        }
    }

    try {
        const isEdit = !!validData.id
        const locationOperator = isEdit ? 'set' : 'connect'

        // 1. Determine Owner and Fetch Upstream Managers (Hidden Members)
        let ownerId = session.id
        if (isEdit) {
            const existingActivity = await prisma.pricingActivity.findUnique({
                where: { id: validData.id },
                select: { userId: true }
            })
            if (existingActivity) ownerId = existingActivity.userId
        }

        const managerIds = await getUpstreamManagers(ownerId)
        const managersWithTeams = await prisma.user.findMany({
            where: { id: { in: managerIds } },
            include: { teams: { take: 1 } }
        })

        const systemMembers = managersWithTeams.map(m => ({
            userId: m.id,
            teamId: m.teams[0]?.id,
            isAutoAdded: true
        })).filter((m): m is { userId: number; teamId: number; isAutoAdded: boolean } => !!m.teamId)

        // Build the set of auto-added userIds: upstream managers of the owner
        // AND upstream managers of all team members (matches form logic).
        const allMemberUserIds = validData.teamMembers.map(tm => tm.userId).filter(Boolean)
        const bulkManagers = await getBulkUpstreamManagers([ownerId, ...allMemberUserIds])
        const autoAddedUserIds = new Set<number>()
        Object.values(bulkManagers).forEach(ids => ids.forEach(id => autoAddedUserIds.add(id)))
        // Also include default-assignment users as auto-added
        // (they are added by useActivityAutoAssignment with isAutoAdded: true)

        // 2. Merge UI Members with System Members
        // Override isAutoAdded authoritatively: if a member is an upstream manager,
        // mark isAutoAdded=true regardless of what the form sent.
        const incomingIds = new Set(validData.teamMembers.map(tm => tm.userId))
        const mergedMembers = validData.teamMembers.map(tm => ({
            ...tm,
            isAutoAdded: autoAddedUserIds.has(tm.userId) ? true : tm.isAutoAdded
        }))

        systemMembers.forEach(sm => {
            if (!incomingIds.has(sm.userId)) {
                mergedMembers.push(sm)
            }
        })

        // Handle Team Members with Diff Logic ("Validate & Update")
        if (isEdit) {
            // 1. Fetch existing members
            const existingMembers = await prisma.activityTeamMember.findMany({
                where: { activityId: validData.id }
            })

            // 2. Filter incoming valid members (using merged list)
            const incomingMembers = mergedMembers
                .filter(tm => tm.teamId && tm.userId && tm.teamId > 0 && tm.userId > 0)

            // 3. Identify members to delete
            // Note: If a system member was present but now we removed it? 
            // The merge logic ensures system members are ALWAYS in mergedMembers unless explicitly removed?
            // No, merge logic adds them if not present. So they persist.
            const incomingKeys = new Set(incomingMembers.map(tm => `${tm.teamId}-${tm.userId}`))
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

            // 4. Identify members to add
            const existingKeys = new Set(existingMembers.map(em => `${em.teamId}-${em.userId}`))
            const membersToAdd = incomingMembers.filter(
                tm => !existingKeys.has(`${tm.teamId}-${tm.userId}`)
            )

            // 5. Create new members
            if (membersToAdd.length > 0) {
                await prisma.activityTeamMember.createMany({
                    data: membersToAdd.map(tm => ({
                        activityId: validData.id!,
                        teamId: tm.teamId,
                        userId: tm.userId,
                        isAutoAdded: tm.isAutoAdded ?? false
                    }))
                })
            }

            // 6. Update isAutoAdded for existing members whose flag changed
            const existingByKey = new Map(
                existingMembers.map(em => [`${em.teamId}-${em.userId}`, em])
            )
            for (const tm of incomingMembers) {
                const existing = existingByKey.get(`${tm.teamId}-${tm.userId}`)
                if (existing && existing.isAutoAdded !== (tm.isAutoAdded ?? false)) {
                    await prisma.activityTeamMember.update({
                        where: { id: existing.id },
                        data: { isAutoAdded: tm.isAutoAdded ?? false }
                    })
                }
            }
        }

        // Ensure the payload doesn't try to create them again if 'create' was left in.
        // We handle creation for Edit mode purely above.
        // For Create mode (isEdit false), we construct the payload below.

        const teamMemberPayload: Prisma.PricingActivityUpdateInput['teamMembers'] = {}
        if (!isEdit) {
            teamMemberPayload.create = mergedMembers
                .filter(tm => tm.teamId && tm.userId && tm.teamId > 0 && tm.userId > 0)
                .map(tm => ({
                    teamId: tm.teamId,
                    userId: tm.userId,
                    isAutoAdded: tm.isAutoAdded ?? false
                }))
        }


        const flatPayload: Record<string, unknown> = {
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
            tcv: validData.tcv ?? null,
            dealDuration: validData.dealDuration ?? null,
            dueDate: new Date(validData.dueDate).toISOString(),

            clientLocations: { [locationOperator]: validData.clientLocationIds.map((id) => ({ id })) },
            deliveryLocations: { [locationOperator]: validData.deliveryLocationIds.map((id) => ({ id })) },

            teamMembers: teamMemberPayload,

            assignDate: validData.assignDate ? new Date(validData.assignDate).toISOString() : new Date().toISOString(),
        }

        // Subvertical (optional relation)
        if (validData.subverticalId) {
            flatPayload.subvertical = { connect: { id: parseInt(validData.subverticalId) } }
        } else if (isEdit) {
            flatPayload.subvertical = { disconnect: true }
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

        const dataWithOutcome: Record<string, unknown> = { ...flatPayload }

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
            subvertical: true,
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
            },
            history: {
                include: {
                    version: true,
                    status: true,
                    outcome: true,
                    user: true
                },
                orderBy: { createdAt: 'desc' as const }
            }
        }

        let activity;
        if (isEdit) {
            activity = await prisma.pricingActivity.update({
                where: { id: validData.id },
                data: dataWithOutcome as Prisma.PricingActivityUpdateInput,
                include: includeRelations
            })
        } else {
            activity = await prisma.pricingActivity.create({
                data: {
                    ...(dataWithOutcome as Prisma.PricingActivityCreateInput),
                    user: { connect: { id: session.id } }
                },
                include: includeRelations
            })
        }

        // Record activity history when version, status, or outcome changes (or on create)
        const versionIdInt = validData.versionId ? parseInt(validData.versionId) : null
        const statusIdInt = validData.statusId ? parseInt(validData.statusId) : null
        const outcomeIdInt = validData.outcomeId ? parseInt(validData.outcomeId) : null

        if (versionIdInt && statusIdInt && outcomeIdInt) {
            let shouldRecord = !isEdit

            if (isEdit) {
                const previous = await prisma.activityHistory.findFirst({
                    where: { activityId: activity.id },
                    orderBy: { createdAt: 'desc' }
                })
                if (!previous ||
                    previous.versionId !== versionIdInt ||
                    previous.statusId !== statusIdInt ||
                    previous.outcomeId !== outcomeIdInt) {
                    shouldRecord = true
                }
            }

            if (shouldRecord) {
                await prisma.activityHistory.create({
                    data: {
                        activityId: activity.id,
                        versionId: versionIdInt,
                        statusId: statusIdInt,
                        outcomeId: outcomeIdInt,
                        userId: session.id
                    }
                })
                // Re-fetch to include the newly created history entry
                activity = await prisma.pricingActivity.findUnique({
                    where: { id: activity.id },
                    include: includeRelations
                })
            }
        }

        return { success: true, activity }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Failed to save activity' }
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

    const page = Math.max(1, params.page || 1)
    const limit = Math.min(100, Math.max(1, params.limit || 20))
    const skip = (page - 1) * limit

    const where = buildActivityWhere(session, {
        search: params.search,
        viewMode: params.viewMode,
        filters: params.filters
    })

    try {
        const [activities, totalCount] = await Promise.all([
            prisma.pricingActivity.findMany({
                where,
                include: {
                    vertical: true,
                    subvertical: true,
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

        // Fetch attachment counts
        const sfIds = activities.map(a => a.id1).filter(Boolean)
        const attachmentCounts = await prisma.attachment.groupBy({
            by: ['id1'],
            where: {
                id1: { in: sfIds }
            },
            _count: {
                id1: true
            }
        })

        const countMap = new Map(attachmentCounts.map(ac => [ac.id1, ac._count.id1]))

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

// Returns the set of available option values for each categorical filter
// dimension given the current filters. Each dimension excludes its own filter
// (disjunctive faceting) so a selection narrows every OTHER filter while still
// letting the user change that dimension.
export async function getActivityFacets(params: ActivityFilterParams) {
    const empty = {
        clients: [] as string[],
        verticalIds: [] as number[],
        versionIds: [] as number[],
        categoryIds: [] as number[],
        statusIds: [] as number[],
        clientLocationIds: [] as number[],
        deliveryLocationIds: [] as number[],
        teamMembers: [] as { team: string; user: string }[]
    }

    const session = await getSession()
    if (!session) return { success: false, data: empty }

    const base: ActivityFilterParams = {
        search: params.search,
        viewMode: params.viewMode,
        filters: params.filters
    }

    try {
        const [
            clients,
            verticalGroups,
            versionGroups,
            categoryGroups,
            statusGroups,
            clientLocs,
            deliveryLocs,
            teamMembers
        ] = await Promise.all([
            prisma.pricingActivity.findMany({
                where: buildActivityWhere(session, base, ['clientName']),
                select: { clientName: true },
                distinct: ['clientName'],
                orderBy: { clientName: 'asc' }
            }),
            prisma.pricingActivity.groupBy({ by: ['verticalId'], where: buildActivityWhere(session, base, ['verticalId']) }),
            prisma.pricingActivity.groupBy({ by: ['versionId'], where: buildActivityWhere(session, base, ['versionId']) }),
            prisma.pricingActivity.groupBy({ by: ['categoryId'], where: buildActivityWhere(session, base, ['categoryId']) }),
            prisma.pricingActivity.groupBy({ by: ['statusId'], where: buildActivityWhere(session, base, ['statusId']) }),
            prisma.location.findMany({
                where: { clientActivities: { some: buildActivityWhere(session, base, ['clientLocationIds']) } },
                select: { id: true }
            }),
            prisma.location.findMany({
                where: { deliveryActivities: { some: buildActivityWhere(session, base, ['deliveryLocationIds']) } },
                select: { id: true }
            }),
            prisma.activityTeamMember.findMany({
                where: { activity: buildActivityWhere(session, base, ['team_*']) },
                select: { team: { select: { teamname: true } }, user: { select: { name: true } } },
                distinct: ['teamId', 'userId']
            })
        ])

        return {
            success: true,
            data: {
                clients: clients.map(c => c.clientName).filter(Boolean),
                verticalIds: verticalGroups.map(g => g.verticalId),
                versionIds: versionGroups.map(g => g.versionId),
                categoryIds: categoryGroups.map(g => g.categoryId),
                statusIds: statusGroups.map(g => g.statusId),
                clientLocationIds: clientLocs.map(l => l.id),
                deliveryLocationIds: deliveryLocs.map(l => l.id),
                teamMembers: teamMembers.map(t => ({ team: t.team.teamname, user: t.user.name }))
            }
        }
    } catch (error) {
        console.error("Error fetching activity facets:", error)
        return { success: false, data: empty }
    }
}

export async function getUniqueClients() {
    try {
        const clients = await prisma.pricingActivity.findMany({
            select: { clientName: true },
            distinct: ['clientName'],
            orderBy: { clientName: 'asc' }
        })
        return { success: true, data: clients.map(c => c.clientName).filter(Boolean) }
    } catch (error) {
        console.error("Error fetching clients:", error)
        return { success: false, data: [] }
    }
}

export async function addComment(activityId: number, text: string) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    if (!text || text.trim().length === 0) return { success: false, message: 'Comment text required' }

    try {
        const comment = await prisma.comment.create({
            data: {
                text,
                activityId,
                userId: session.id
            },
            include: {
                user: true
            }
        })
        return { success: true, comment }
    } catch (error) {
        console.error("Error adding comment:", error)
        return { success: false, message: 'Failed to add comment' }
    }
}

export async function deleteComment(commentId: number) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    return prisma.$transaction(async (tx) => {
        const comment = await tx.comment.findUnique({
            where: { id: commentId },
            select: { userId: true }
        })

        if (!comment) return { success: false, message: 'Comment not found' }

        // Allow delete if author or ADMIN
        if (comment.userId !== session.id && session.role !== 'ADMIN') {
            return { success: false, message: 'Forbidden' }
        }

        await tx.comment.delete({ where: { id: commentId } })
        return { success: true }
    })
}

export async function getActivityStats(params?: {
    search?: string
    viewMode?: 'pipeline' | 'closed' | 'inactive'
    filters?: Record<string, string>
}) {
    const session = await getSession()
    if (!session) return { success: false, data: { minAcv: 0, maxAcv: 0, minDate: null, maxDate: null } }

    try {
        // Exclude ACV/Date self-filters so the slider bounds reflect the rest of
        // the data (other active filters still constrain the range).
        const where = buildActivityWhere(
            session,
            { search: params?.search, viewMode: params?.viewMode, filters: params?.filters },
            ['annualContractValue', 'annualContractValue_min', 'annualContractValue_max', 'dueDate_days_min', 'dueDate_days_max']
        )

        const aggregations = await prisma.pricingActivity.aggregate({
            _min: {
                annualContractValue: true,
                dueDate: true
            },
            _max: {
                annualContractValue: true,
                dueDate: true
            },
            where
        })

        return {
            success: true,
            data: {
                minAcv: aggregations._min.annualContractValue || 0,
                maxAcv: aggregations._max.annualContractValue || 0,
                minDate: aggregations._min.dueDate || null,
                maxDate: aggregations._max.dueDate || null
            }
        }
    } catch (error) {
        console.error("Error fetching activity stats:", error)
        return { success: false, data: { minAcv: 0, maxAcv: 0, minDate: null, maxDate: null } }
    }
}

// Fetch a single activity with all relations used by the activity form page.
export async function getActivityById(id: number) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        const activity = await prisma.pricingActivity.findUnique({
            where: { id },
            include: {
                vertical: true,
                subvertical: true,
                horizontal: true,
                clientLocations: true,
                deliveryLocations: true,
                status: true,
                category: true,
                version: true,
                user: { include: { teams: true, manager: true } },
                teamMembers: { include: { team: true, user: true } },
                outcome: true,
                comments: { include: { user: true }, orderBy: { createdAt: 'desc' as const } },
                history: {
                    include: {
                        version: true,
                        status: true,
                        outcome: true,
                        user: true
                    },
                    orderBy: { createdAt: 'desc' as const }
                }
            }
        })

        if (!activity) return { success: false, message: 'Activity not found' }

        // Authorization: owner, team member, or admin
        const isOwner = activity.userId === session.id
        const isTeamMember = activity.teamMembers.some(tm => tm.userId === session.id)
        if (!isOwner && !isTeamMember && session.role !== 'ADMIN') {
            return { success: false, message: 'Forbidden' }
        }

        return { success: true, activity }
    } catch (error) {
        console.error('Error fetching activity:', error)
        return { success: false, message: 'Failed to fetch activity' }
    }
}

// Fetch the lookups needed by the activity form page, with optional user sort
// preference applied (mirrors the dashboard page behavior).
export async function getActivityFormLookups(sessionUserId: number) {
    const [
        users,
        verticals,
        subverticals,
        horizontals,
        locations,
        statuses,
        versions,
        categories,
        outcomes,
        teams,
        currentUserData
    ] = await Promise.all([
        prisma.user.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: { teams: true, manager: true }
        }),
        prisma.vertical.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.subvertical.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' }, include: { vertical: true } }),
        prisma.horizontal.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.location.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.status.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.version.findMany({ orderBy: { displayOrder: 'asc' } }),
        prisma.category.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.outcome.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.team.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' }, include: { users: true } }),
        prisma.user.findUnique({ where: { id: sessionUserId } })
    ])

    const applyUserSort = <T extends { id: number; displayOrder?: number }>(items: T[], category: string): T[] => {
        if (!currentUserData?.preferenceSortOrder) return items
        try {
            const orderMap = JSON.parse(currentUserData.preferenceSortOrder) as Record<string, unknown>
            const orderIds = orderMap[category]
            if (!Array.isArray(orderIds)) return items
            const priorityMap = new Map(orderIds.map((id, index) => [id, index]))
            return [...items].sort((a, b) => {
                const pA = priorityMap.has(a.id) ? priorityMap.get(a.id)! : 9999
                const pB = priorityMap.has(b.id) ? priorityMap.get(b.id)! : 9999
                return pA - pB
            })
        } catch (e) {
            console.error('Failed to parse preferenceSortOrder', e)
            return items
        }
    }

    return {
        lookups: {
            statuses,
            categories,
            versions,
            locations: applyUserSort(locations, 'location'),
            verticals: applyUserSort(verticals, 'vertical'),
            horizontals: applyUserSort(horizontals, 'horizontal'),
            outcomes,
            users,
            teams: applyUserSort(teams, 'team'),
            subverticals
        },
        user: currentUserData
    }
}
