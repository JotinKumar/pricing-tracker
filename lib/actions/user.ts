'use server'

import prisma from '@/lib/db'
import { getSession } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'

export async function updatePreferences(data: {
    avatar: string | null
    preferenceTheme: string
    preferenceCurrency: string | null
    preferenceDateFormat: string | null
    preferenceAcvUnit: string | null
    preferenceAcvDecimals: string | null
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
                preferenceCurrency: data.preferenceCurrency,
                preferenceDateFormat: data.preferenceDateFormat,
                preferenceAcvUnit: data.preferenceAcvUnit,
                preferenceAcvDecimals: data.preferenceAcvDecimals
            }
        })

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Failed to update preferences:', error)
        return { success: false, message: 'Failed to update preferences' }
    }
}
