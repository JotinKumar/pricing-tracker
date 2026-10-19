'use server'

import prisma from '@/lib/db'
import { getSession } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'

export async function updatePreferences(data: {
    avatar: string | null
    preferenceTheme: string
    preferenceDateFormat: string | null
    preferenceAcvUnit: string | null
    preferenceAcvDecimals: string | null
    preferenceSortOrder: string | null
    statusMessage: string | null
    statusIndicator: string | null
}) {
    const session = await getSession()
    // Session struct from auth.ts is { id, role, name } directly, not nested under user
    if (!session || !session.id) {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        await prisma.user.update({
            where: { id: session.id },
            data: {
                avatar: data.avatar,
                preferenceTheme: data.preferenceTheme,
                preferenceDateFormat: data.preferenceDateFormat,
                preferenceAcvUnit: data.preferenceAcvUnit,
                preferenceAcvDecimals: data.preferenceAcvDecimals,
                preferenceSortOrder: data.preferenceSortOrder,
                statusMessage: data.statusMessage,
                statusIndicator: data.statusIndicator
            }
        })

        revalidatePath('/')
        return { success: true }
    } catch (error: unknown) {
        console.error('Failed to update preferences:', error)
        return { success: false, message: 'Failed to update preferences' }
    }
}

export async function getUpstreamManagers(userId: number) {
    const managers: number[] = []
    let currentId = userId

    // Safety limit to prevent infinite loops if circular dependency exists
    let depth = 0
    const MAX_DEPTH = 20

    while (depth < MAX_DEPTH) {
        const user = await prisma.user.findUnique({
            where: { id: currentId },
            select: { managerId: true }
        })

        if (!user || !user.managerId) break

        // Circular check
        if (managers.includes(user.managerId)) break

        managers.push(user.managerId)
        currentId = user.managerId
        depth++
    }

    return managers
}

export async function getBulkUpstreamManagers(userIds: number[]) {
    // Optimization: deduplicate inputs
    const uniqueIds = Array.from(new Set(userIds))
    const results: Record<number, number[]> = {}

    // We can run in parallel
    await Promise.all(uniqueIds.map(async (uid) => {
        results[uid] = await getUpstreamManagers(uid)
    }))

    return results
}

// Fetch upstream managers for the given user IDs, returning full user objects
// with their first team so callers can place them in the correct team.
export async function getManagersWithTeams(userIds: number[]) {
    const managerMap = await getBulkUpstreamManagers(userIds)
    const allManagerIds = new Set<number>()
    Object.values(managerMap).forEach(ids => ids.forEach(id => allManagerIds.add(id)))

    if (allManagerIds.size === 0) return []

    const managers = await prisma.user.findMany({
        where: { id: { in: Array.from(allManagerIds) }, isActive: true },
        include: { teams: { take: 1 } }
    })

    return managers.map(m => ({
        id: m.id,
        name: m.name,
        teamId: m.teams[0]?.id ?? null
    }))
}

export async function getLookups() {
    try {
        const [verticals, horizontals, locations, teams] = await Promise.all([
            prisma.vertical.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
            prisma.horizontal.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
            prisma.location.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
            prisma.team.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } })
        ])
        return {
            success: true,
            data: { verticals, horizontals, locations, teams }
        }
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : String(error) }
    }
}
