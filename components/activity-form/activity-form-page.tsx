'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import ActivityForm from './activity-form'
import { Lookups, PricingActivityWithHistory, UserSession } from '@/types'

interface ActivityFormPageProps {
    activity: PricingActivityWithHistory | null
    lookups: Lookups
    session: UserSession
    isEdit: boolean
}

export function ActivityFormPage({ activity, lookups, session, isEdit }: ActivityFormPageProps) {
    const router = useRouter()

    const handleClose = useCallback(() => {
        router.push('/dashboard')
    }, [router])

    const handleSuccess = useCallback(() => {
        router.push('/dashboard')
        router.refresh()
    }, [router])

    return (
        <ActivityForm
            activity={activity}
            lookups={lookups}
            session={session}
            isEdit={isEdit}
            onClose={handleClose}
            onSuccess={handleSuccess}
        />
    )
}
