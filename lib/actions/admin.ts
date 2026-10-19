
'use server'

import prisma from '../db'
import { getSession } from './auth'
import { adminUserSchema, adminLookupSchema } from '../schemas'
import { Prisma } from '@prisma/client'
import { AdminUserFormValues, AdminLookupFormValues, User, AdminDataItem } from '@/types'

async function isAdmin() {
    const session = await getSession()
    return session && session.role === 'ADMIN'
}

type AdminDataType = 'User' | 'Team' | 'Vertical' | 'Horizontal' | 'Location' | 'Status' | 'Category' | 'Version' | 'Outcome' | 'DocumentType' | 'SalesforceStage' | 'Subvertical'
type AdminModelName = 'user' | 'team' | 'vertical' | 'horizontal' | 'location' | 'status' | 'category' | 'version' | 'outcome' | 'documentType' | 'salesforceStage' | 'subvertical'

type PrismaAdminDelegate = {
    findMany: (args: { orderBy?: Record<string, 'asc' | 'desc'> }) => Prisma.PrismaPromise<unknown[]>
    update: (args: { where: { id: number }; data: Record<string, unknown> }) => Prisma.PrismaPromise<unknown>
    create: (args: { data: Record<string, unknown> }) => Prisma.PrismaPromise<unknown>
    delete: (args: { where: { id: number } }) => Prisma.PrismaPromise<unknown>
}

function getAdminModel(modelName: AdminModelName) {
    const delegate = (prisma as unknown as Record<string, PrismaAdminDelegate>)[modelName]
    if (!delegate) throw new Error(`Unknown model: ${modelName}`)
    return delegate
}

const getModelName = (type: AdminDataType): AdminModelName => {
    switch (type) {
        case 'DocumentType': return 'documentType'
        case 'SalesforceStage': return 'salesforceStage'
        case 'Subvertical': return 'subvertical'
        case 'User': return 'user'
        default: return type.toLowerCase() as AdminModelName
    }
}

import { TEAM_ORDER } from '../constants'

export async function getAdminData(type: 'User'): Promise<{ success: true; data: User[] } | { success: false; message: string }>
export async function getAdminData(type: AdminDataType): Promise<{ success: true; data: AdminDataItem[] } | { success: false; message: string }>
export async function getAdminData(type: AdminDataType) {
    if (!await isAdmin()) return { success: false, message: 'Unauthorized' }

    try {
        let data: User[] | AdminDataItem[];
        const modelName = getModelName(type)

        if (type === 'User') {
            data = await prisma.user.findMany({ orderBy: { id: 'asc' }, include: { teams: true, manager: true } });
        } else if (type === 'Subvertical') {
            data = await prisma.subvertical.findMany({
                orderBy: { displayOrder: 'asc' },
                include: { vertical: true }
            }) as unknown as AdminDataItem[];
        } else {
            // Use displayOrder for all other types
            data = (await getAdminModel(modelName).findMany({ orderBy: { displayOrder: 'asc' } })) as AdminDataItem[];
            // Custom sort removed in favor of DB displayOrder
        }

        return { success: true, data }
    } catch (error) {
        console.error("Fetch Error", error)
        return { success: false, message: 'Failed to fetch data' }
    }
}

export async function saveAdminData(type: AdminDataType, data: AdminUserFormValues | AdminLookupFormValues) {
    if (!await isAdmin()) return { success: false, message: 'Unauthorized' }

    try {
        // Validation using Zod
        if (type === 'User') {
            const parse = adminUserSchema.safeParse(data)
            if (!parse.success) return { success: false, message: parse.error.issues[0].message }

            const validData = parse.data
            // Strip firstName/lastName, maintain name
            const { id, teams, managerId, firstName, lastName, ...userData } = validData

            const teamConnect = teams ? { [id ? 'set' : 'connect']: teams.map((tId: number) => ({ id: tId })) } : undefined
            const managerConnect = managerId ? { connect: { id: managerId } } : (id ? { disconnect: true } : undefined) // Only disconnect if editing

            const finalData: Prisma.UserUpdateInput = { ...userData }
            // Ensure name is present (schema made it optional, but DB needs it if creating)
            if (!finalData.name && (firstName || lastName)) {
                finalData.name = `${firstName || ''} ${lastName || ''}`.trim()
            }
            if (!finalData.name) {
                return { success: false, message: 'Name is required' }
            }

            if (teamConnect) finalData.teams = teamConnect
            if (managerConnect) finalData.manager = managerConnect

            if (id) {
                await prisma.user.update({ where: { id }, data: finalData })
            } else {
                await prisma.user.create({ data: finalData as Prisma.UserCreateInput })
            }

        } else {
            // Lookup Tables
            const parse = adminLookupSchema.safeParse(data)
            // We need to validate the dynamic field manually or extend schema temporarily
            if (!parse.success) return { success: false, message: parse.error.issues[0].message }

            // Validate the specific required field for this type
            const requiredFields: Record<string, string> = {
                'Team': 'teamname',
                'Vertical': 'vertical',
                'Horizontal': 'horizontal',
                'Location': 'country',
                'Status': 'status',
                'Version': 'version',
                'Outcome': 'outcome',
                'DocumentType': 'type',
                'SalesforceStage': 'stage',
                'Subvertical': 'subvertical'
            }
            const fieldName = requiredFields[type]
            if (!parse.data[fieldName]) return { success: false, message: `${fieldName} is required` }

            // Subvertical requires a parent vertical
            if (type === 'Subvertical') {
                const verticalId = Number(parse.data.verticalId)
                if (!verticalId) return { success: false, message: 'Vertical is required' }
            }

            const { id } = parse.data
            // Ensure ID is number if present (Zod handled it but let's be safe for Prisma)
            const numId = id ? Number(id) : undefined

            // Sanitize data: only include fields valid for the model
            const cleanData: Record<string, unknown> = {
                [fieldName]: parse.data[fieldName],
                display: parse.data.display,
                isActive: parse.data.isActive,
                ...(type === 'Location' && { currency: parse.data.currency }),
                ...(type === 'SalesforceStage' && { description: parse.data.description }),
                ...(type === 'Subvertical' && {
                    vertical: { connect: { id: Number(parse.data.verticalId) } }
                })
            }

            const model = getAdminModel(getModelName(type))
            if (numId) {
                await model.update({
                    where: { id: numId },
                    data: cleanData
                })
            } else {
                await model.create({
                    data: cleanData
                })
            }
        }

        return { success: true }
    } catch (error: unknown) {
        const prismaError = error as { code?: string; meta?: { target?: string[] } }
        if (prismaError.code === 'P2002') {
            const target = prismaError.meta?.target || []
            const errors: Record<string, string> = {}

            if (target.includes('email')) {
                errors.email = 'Email already exists'
            }
            if (target.includes('display')) {
                errors.display = 'Display code already exists'
            }
            // For lookup tables, the main field (e.g. 'teamname') is unique too.
            // We need to identify which field it is.
            // We can try to guess from target if we don't map explicitly, 
            // but we can also use the known schema logic.
            // 'User' has email.
            // Lookups have [fieldName].

            // Check dynamic field collision
            if (type !== 'User') {
                const requiredFields: Record<string, string> = {
                    'Team': 'teamname',
                    'Vertical': 'vertical',
                    'Horizontal': 'horizontal',
                    'Location': 'country',
                    'Status': 'status',
                    'Version': 'version',
                    'Outcome': 'outcome',
                    'DocumentType': 'type',
                    'Category': 'category',
                    'SalesforceStage': 'stage',
                    'Subvertical': 'subvertical'
                }
                const fieldName = requiredFields[type] || 'name'
                if (target.includes(fieldName)) {
                    errors[fieldName] = `${type} Name already exists`
                }
            }

            if (Object.keys(errors).length > 0) {
                return { success: false, errors }
            }

            return { success: false, message: 'Unique constraint violation' }
        }
        console.error("Save Admin Data Error:", error)
        return { success: false, message: 'Failed to save data' }
    }
}

export async function deleteAdminData(type: AdminDataType, id: number) {
    if (!await isAdmin()) return { success: false, message: 'Unauthorized' }

    try {
        const modelName = getModelName(type)
        const model = getAdminModel(modelName)

        await model.delete({
            where: { id: Number(id) }
        })

        return { success: true }
    } catch (error: unknown) {
        const prismaError = error as { code?: string }
        if (prismaError.code === 'P2003') {
            return { success: false, message: 'Cannot delete: This item is in use. Try setting it to inactive instead.' }
        }
        return { success: false, message: 'Failed to delete data' }
    }
}

import { revalidatePath } from 'next/cache'

export async function getSystemSetting(key: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key }
        })
        return { success: true, data: setting?.value }
    } catch (error) {
        console.error('Error fetching system setting:', error)
        return { success: false, message: 'Failed to fetch setting' }
    }
}

export async function updateSystemSetting(key: string, value: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        await prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        })

        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (error) {
        console.error('Error updating system setting:', error)
        return { success: false, message: 'Failed to update setting' }
    }
}

export async function updateDisplayOrder(type: AdminDataType, items: { id: number, displayOrder: number }[]) {
    if (!await isAdmin()) return { success: false, message: 'Unauthorized' }

    const modelName = getModelName(type)
    if (modelName === 'user') return { success: false, message: 'Cannot reorder users' }

    try {
        const model = getAdminModel(modelName)
        // Use transaction for atomic updates
        await prisma.$transaction(
            items.map((item) =>
                model.update({
                    where: { id: item.id },
                    data: { displayOrder: item.displayOrder }
                })
            )
        )
        return { success: true }
    } catch (error: unknown) {
        console.error('Failed to update order', error)
        return { success: false, message: 'Failed to update display order' }
    }
}
