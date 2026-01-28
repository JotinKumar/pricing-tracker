'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getFieldConfigs() {
    try {
        const configs = await prisma.fieldConfig.findMany()
        return { success: true, data: configs }
    } catch (error) {
        console.error('Error fetching field configs:', error)
        return { success: false, message: 'Failed to fetch field configurations' }
    }
}

export async function saveFieldConfig(data: {
    targetField: string
    fieldName: string
    fieldType: string
    hasPrefix: boolean
    prefix?: string
    isActive: boolean
    displayOnDashboard: boolean
}) {
    try {
        const config = await prisma.fieldConfig.upsert({
            where: { targetField: data.targetField },
            update: {
                fieldName: data.fieldName,
                fieldType: data.fieldType,
                hasPrefix: data.hasPrefix,
                prefix: data.prefix,
                isActive: data.isActive,
                displayOnDashboard: data.displayOnDashboard
            },
            create: {
                targetField: data.targetField,
                fieldName: data.fieldName,
                fieldType: data.fieldType,
                hasPrefix: data.hasPrefix,
                prefix: data.prefix,
                isActive: data.isActive,
                displayOnDashboard: data.displayOnDashboard
            }
        })
        revalidatePath('/dashboard/admin')
        return { success: true, data: config }
    } catch (error) {
        console.error('Error saving field config:', error)
        return { success: false, message: 'Failed to save configuration' }
    }
}
