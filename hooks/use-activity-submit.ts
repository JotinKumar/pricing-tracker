'use client'

import { useState, useCallback } from 'react'
import { ActivityFormValues } from '@/lib/schemas'
import { PricingActivity } from '@/types'

interface UseActivitySubmitProps {
    isEdit: boolean
    initialVersionId: string
    onSuccess: (activity: PricingActivity) => void
}

interface UseActivitySubmitReturn {
    loading: boolean
    error: string
    showVersionConfirm: boolean
    pendingData: ActivityFormValues | null
    setShowVersionConfirm: (show: boolean) => void
    setPendingData: (data: ActivityFormValues | null) => void
    handleSubmit: (data: ActivityFormValues) => Promise<void>
    processSubmission: (data: ActivityFormValues, asNew?: boolean) => Promise<void>
}

export function useActivitySubmit({
    isEdit,
    initialVersionId,
    onSuccess
}: UseActivitySubmitProps): UseActivitySubmitReturn {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showVersionConfirm, setShowVersionConfirm] = useState(false)
    const [pendingData, setPendingData] = useState<ActivityFormValues | null>(null)

    const processSubmission = useCallback(async (data: ActivityFormValues, asNew: boolean = false) => {
        setLoading(true)
        setError('')
        setShowVersionConfirm(false)

        const { submitActivity } = await import('@/lib/actions/activity')
        
        const payload = { ...data }
        if (asNew) {
            delete (payload as { id?: number }).id
        }

        const result = await submitActivity(payload)

        if (result.success && result.activity) {
            onSuccess(result.activity)
        } else {
            setError(result.message || 'Operation failed')
            setLoading(false)
        }
    }, [onSuccess])

    const handleSubmit = useCallback(async (data: ActivityFormValues) => {
        if (isEdit && initialVersionId && data.versionId !== initialVersionId) {
            setPendingData(data)
            setShowVersionConfirm(true)
            return
        }

        await processSubmission(data)
    }, [isEdit, initialVersionId, processSubmission])

    return {
        loading,
        error,
        showVersionConfirm,
        pendingData,
        setShowVersionConfirm,
        setPendingData,
        handleSubmit,
        processSubmission
    }
}
