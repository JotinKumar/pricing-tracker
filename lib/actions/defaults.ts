'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getDefaults(type?: string) {
    try {
        const where = type ? { type } : {}
        const assignments = await prisma.defaultAssignment.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        initials: true,
                        teams: { select: { id: true, teamname: true } }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Collect IDs for enrichment
        const verticalIds: number[] = []
        const horizontalIds: number[] = []
        const locationIds: number[] = []

        assignments.forEach((a: any) => {
            if (a.referenceId) {
                if (a.type === 'Vertical') verticalIds.push(a.referenceId)
                else if (a.type === 'Horizontal') horizontalIds.push(a.referenceId)
                else if (a.type === 'Location' || a.type === 'Client Location' || a.type === 'Delivery Location') locationIds.push(a.referenceId)
            }
        })

        // Fetch names
        const verticals = verticalIds.length ? await prisma.vertical.findMany({ where: { id: { in: verticalIds } }, select: { id: true, vertical: true } }) : []
        const horizontals = horizontalIds.length ? await prisma.horizontal.findMany({ where: { id: { in: horizontalIds } }, select: { id: true, horizontal: true } }) : []
        const locations = locationIds.length ? await prisma.location.findMany({ where: { id: { in: locationIds } }, select: { id: true, country: true } }) : []

        // Map names back
        const data = assignments.map((a: any) => {
            let referenceName = ''
            if (a.referenceId) {
                if (a.type === 'Vertical') referenceName = verticals.find(v => v.id === a.referenceId)?.vertical || ''
                else if (a.type === 'Horizontal') referenceName = horizontals.find(h => h.id === a.referenceId)?.horizontal || ''
                else if (['Location', 'Client Location', 'Delivery Location'].includes(a.type)) referenceName = locations.find(l => l.id === a.referenceId)?.country || ''
            }
            return {
                ...a,
                referenceName
            }
        })

        return { success: true, data }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

export async function saveDefault(data: { type: string, referenceId: string | null, userId: number }) {
    try {
        const referenceIdInt = data.referenceId ? parseInt(String(data.referenceId)) : null

        // Check for existing
        const existing = await prisma.defaultAssignment.findUnique({
            where: {
                type_referenceId_userId: {
                    type: data.type,
                    referenceId: referenceIdInt || 0, // Prisma unique constraint handles nulls differently sometimes, but here we defined Int? so we need to be careful. Actually unique constraint on nullable fields works in SQLite. 
                    // WAIT: Prisma unique compound with nullable fields can be tricky. 
                    // Let's rely on findFirst to be safe if unique fails or just try create.
                    // But actually, simpler to just allow create and catch error if duplicate.
                    userId: data.userId
                } as any // Casting because Prisma types might need generation for the compound key input
            }
        })

        // Actually, to avoid "Unique constraint failed" errors cleanly:
        // Let's use upsert or delete/create? No, just create.

        // Correction: Schema defined @@unique([type, referenceId, userId]).
        // SQLite treats nulls as distinct for unique constraints usually? No, standard SQL often does, but let's see.

        const result = await prisma.defaultAssignment.create({
            data: {
                type: data.type,
                referenceId: referenceIdInt,
                userId: data.userId
            }
        })

        revalidatePath('/dashboard/admin')
        return { success: true, data: result }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, message: 'This default rule already exists.' }
        }
        return { success: false, message: error.message }
    }
}

export async function deleteDefault(id: number) {
    try {
        await prisma.defaultAssignment.delete({
            where: { id }
        })
        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

/**
 * Main Logic: Get applicable users based on selections
 */
export async function getApplicableDefaults(params: {
    verticalId?: string,
    horizontalId?: string,
    clientLocationIds?: string[]
    deliveryLocationIds?: string[]
}) {
    try {
        const { verticalId, horizontalId, clientLocationIds, deliveryLocationIds } = params

        const conditions: any[] = []

        // Vertical Rules
        if (verticalId) {
            conditions.push({
                type: 'Vertical',
                OR: [
                    { referenceId: parseInt(verticalId) },
                    { referenceId: null }
                ]
            })
        }

        // Horizontal Rules
        if (horizontalId) {
            conditions.push({
                type: 'Horizontal',
                OR: [
                    { referenceId: parseInt(horizontalId) },
                    { referenceId: null }
                ]
            })
        }

        // Client Location Rules
        if (params.clientLocationIds && params.clientLocationIds.length > 0) {
            const ids = params.clientLocationIds.map(id => parseInt(id))
            conditions.push({
                type: 'Client Location',
                OR: [
                    { referenceId: { in: ids } },
                    { referenceId: null }
                ]
            })
        }

        // Delivery Location Rules
        if (params.deliveryLocationIds && params.deliveryLocationIds.length > 0) {
            const ids = params.deliveryLocationIds.map(id => parseInt(id))
            conditions.push({
                type: 'Delivery Location',
                OR: [
                    { referenceId: { in: ids } },
                    { referenceId: null }
                ]
            })
        }

        if (conditions.length === 0) return { success: true, data: [] }

        const defaults = await prisma.defaultAssignment.findMany({
            where: {
                OR: conditions
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        initials: true,
                        manager: { select: { id: true, name: true } },
                        teams: { select: { id: true, teamname: true } }
                    }
                }
            }
        })

        // Deduplicate users
        const uniqueUsers = new Map()
        defaults.forEach((d: any) => {
            if (!uniqueUsers.has(d.userId)) {
                uniqueUsers.set(d.userId, d.user)
            }
        })

        return { success: true, data: Array.from(uniqueUsers.values()) }

    } catch (error: any) {
        return { success: false, message: error.message }
    }
}
