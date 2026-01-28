
'use server'

import prisma from '../db'
import { getSession } from './auth'
import { adminUserSchema, adminLookupSchema } from '../schemas'

async function isAdmin() {
    const session = await getSession()
    return session && session.role === 'ADMIN'
}

type AdminDataType = 'User' | 'Team' | 'Vertical' | 'Horizontal' | 'Location' | 'Status' | 'Category' | 'Version' | 'Outcome' | 'DocumentType'

const getModelName = (type: AdminDataType) => {
    switch (type) {
        case 'DocumentType': return 'documentType'
        case 'User': return 'user'
        default: return type.toLowerCase()
    }
}

import { TEAM_ORDER } from '../constants'

export async function getAdminData(type: AdminDataType) {
    if (!await isAdmin()) return { success: false, message: 'Unauthorized' }

    try {
        let data;
        const modelName = getModelName(type)

        if (type === 'User') {
            data = await prisma.user.findMany({ orderBy: { id: 'asc' }, include: { teams: true, manager: true } });
        } else {
            data = await (prisma as any)[modelName].findMany({ orderBy: { id: 'asc' } });

            // Apply custom sort for Teams
            if (type === 'Team') {
                data.sort((a: any, b: any) => {
                    const indexA = TEAM_ORDER.indexOf(a.teamname);
                    const indexB = TEAM_ORDER.indexOf(b.teamname);

                    // Handle items not in the list (put them at the end)
                    if (indexA === -1 && indexB === -1) return a.teamname.localeCompare(b.teamname);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;

                    return indexA - indexB;
                })
            }
        }

        return { success: true, data }
    } catch (error) {
        console.error("Fetch Error", error)
        return { success: false, message: 'Failed to fetch data' }
    }
}

export async function saveAdminData(type: AdminDataType, data: any) {
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

            const finalData: any = { ...userData }
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
                await prisma.user.create({ data: finalData })
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
                'DocumentType': 'type'
            }
            const fieldName = requiredFields[type]
            if (!data[fieldName]) return { success: false, message: `${fieldName} is required` }

            const { id } = data
            // Ensure ID is number if present (Zod handled it but let's be safe for Prisma)
            const numId = id ? Number(id) : undefined

            // Sanitize data: only include fields valid for the model
            const cleanData = {
                [fieldName]: data[fieldName],
                display: data.display,
                isActive: data.isActive,
                ...(type === 'Location' && { currency: data.currency })
            }

            if (numId) {
                await (prisma as any)[getModelName(type)].update({
                    where: { id: numId },
                    data: cleanData
                })
            } else {
                await (prisma as any)[getModelName(type)].create({
                    data: cleanData
                })
            }
        }

        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            const target = error.meta?.target || []
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
                    'Category': 'category'
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
        return { success: false, message: error.message || 'Failed to save data' }
    }
}

export async function deleteAdminData(type: AdminDataType, id: number) {
    if (!await isAdmin()) return { success: false, message: 'Unauthorized' }

    try {
        const modelName = getModelName(type)
        const model: any = (prisma as any)[modelName]

        await model.delete({
            where: { id: Number(id) }
        })

        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2003') {
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
