'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getSession } from './auth'
import type { FieldConfig } from '@/types'

export async function getFieldConfigs() {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    try {
        const configs = await prisma.fieldConfig.findMany()
        return { success: true, data: configs }
    } catch (error) {
        console.error('Error fetching field configs:', error)
        return { success: false, message: 'Failed to fetch field configurations' }
    }
}

export async function saveFieldConfig(data: FieldConfig) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        const config = await prisma.fieldConfig.upsert({
            where: { targetField: data.targetField ?? '' },
            update: {
                fieldName: data.fieldName,
                fieldType: data.fieldType ?? 'STRING',
                hasPrefix: data.hasPrefix ?? false,
                prefix: data.prefix ?? null,
                isActive: data.isActive ?? true,
                displayOnDashboard: data.displayOnDashboard ?? true
            },
            create: {
                targetField: data.targetField ?? '',
                fieldName: data.fieldName,
                fieldType: data.fieldType ?? 'STRING',
                hasPrefix: data.hasPrefix ?? false,
                prefix: data.prefix ?? null,
                isActive: data.isActive ?? true,
                displayOnDashboard: data.displayOnDashboard ?? true
            }
        })
        revalidatePath('/dashboard/admin')
        return { success: true, data: config }
    } catch (error) {
        console.error('Error saving field config:', error)
        return { success: false, message: 'Failed to save configuration' }
    }
}
