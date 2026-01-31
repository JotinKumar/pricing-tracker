'use server'

import prisma from '@/lib/db'

export async function getUniqueCurrencies() {
    try {
        const locations = await prisma.location.findMany({
            where: { isActive: true },
            select: { currency: true },
            distinct: ['currency']
        })

        const currencies = locations
            .map(l => l.currency)
            .filter((c): c is string => !!c && c.trim() !== '') // Filter nulls and empty strings
            .sort()

        return { success: true, data: currencies }
    } catch (error) {
        console.error('Error fetching currencies:', error)
        return { success: false, message: 'Failed to fetch currencies' }
    }
}
