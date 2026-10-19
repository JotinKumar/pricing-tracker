
'use server'

import { cookies } from 'next/headers'
import prisma from '../db'
import { redirect } from 'next/navigation'
import { createHmac, timingSafeEqual } from 'crypto'

// Simple session duration
const SESSION_DURATION = 60 * 60 * 24 * 7 // 1 week

const SESSION_SECRET = process.env.SESSION_SECRET

function sign(value: string): string {
    if (!SESSION_SECRET) {
        throw new Error('SESSION_SECRET must be configured')
    }
    return createHmac('sha256', SESSION_SECRET).update(value).digest('hex')
}

function verifySignature(value: string, signature: string): boolean {
    const expected = sign(value)
    try {
        return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    } catch {
        return false
    }
}

export async function login(email: string) {
    if (!email) {
        return { success: false, message: 'Email is required' }
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { success: false, message: 'Invalid email format' }
    }

    // 1. Try to find user
    let user = await prisma.user.findUnique({
        where: { email },
    })

    // 2. Dev Fallback: Only in non-production, create known test users if DB is empty
    if (!user && process.env.NODE_ENV !== 'production') {
        if (email === 'admin@example.com') {
            user = await prisma.user.create({
                data: { email, name: 'Admin', role: 'ADMIN' }
            })
        } else if (email === 'manager@example.com') {
            user = await prisma.user.create({
                data: { email, name: 'Manager Bob', role: 'MANAGER' }
            })
        }
    }

    if (!user) {
        return { success: false, message: 'User not found' }
    }

    if (!user.isActive) {
        return { success: false, message: 'User is deactivated' }
    }

    // 3. Set Session (signed cookie prevents tampering)
    const sessionValue = JSON.stringify({
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
    })
    const signature = sign(sessionValue)
    const signedCookie = `${sessionValue}.${signature}`

    const cookieStore = await cookies()
    cookieStore.set('session', signedCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
    })

    return { success: true }
}

export async function logout() {
    (await cookies()).delete('session')
    redirect('/login')
}

export async function getSession() {
    const sessionCookie = (await cookies()).get('session')
    if (!sessionCookie?.value) return null
    try {
        const raw = sessionCookie.value
        const lastDot = raw.lastIndexOf('.')
        if (lastDot === -1) return null

        const value = raw.substring(0, lastDot)
        const signature = raw.substring(lastDot + 1)

        if (!verifySignature(value, signature)) return null

        const parsed = JSON.parse(value)
        if (!parsed.id) return null

        // Fetch fresh user data from DB (role/permissions from server, not cookie)
        const user = await prisma.user.findUnique({
            where: { id: parsed.id }
        })

        if (!user || !user.isActive) return null

        return {
            id: user.id,
            role: user.role,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            preferenceTheme: user.preferenceTheme,
            preferenceDateFormat: user.preferenceDateFormat,
            preferenceAcvUnit: user.preferenceAcvUnit,
            preferenceAcvDecimals: user.preferenceAcvDecimals,
            preferenceCurrency: user.preferenceCurrency,
            preferenceSortOrder: user.preferenceSortOrder,
            statusMessage: user.statusMessage,
            statusIndicator: user.statusIndicator
        }
    } catch {
        return null
    }
}
