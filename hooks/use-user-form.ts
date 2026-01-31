import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminUserSchema } from '@/lib/schemas'
import { ApiResponse, Team } from '@/types'
import { z } from 'zod'

// Define the schema type from the imported Zod schema
// adminUserSchema is likely z.object({...}) 
// We should infer types from it or use the existing UserFormValues interface if exported.
// The original file defined UserFormValues locally. We should probably export it or redefine it here.
// For now, I'll redefine the interface to match what was in user-modal.tsx or infer from helper.

export interface UserFormValues {
    id?: number
    email: string
    name?: string
    firstName?: string
    lastName?: string
    initials?: string
    designation?: string
    avatar?: string
    managerId?: number
    role: 'USER' | 'MANAGER' | 'ADMIN' | 'READ_ONLY'
    teams: number[]
    isActive: boolean
}

type UseUserFormProps = {
    editItem: UserFormValues | null
    handleSave: (data: UserFormValues) => Promise<ApiResponse>
    availableTeams: Team[]
}

export function useUserForm({ editItem, handleSave }: UseUserFormProps) {
    const getNameParts = (fullName: string) => {
        if (!fullName) return { first: '', last: '' }
        const parts = fullName.split(' ')
        if (parts.length === 1) return { first: parts[0], last: '' }
        return { first: parts[0], last: parts.slice(1).join(' ') }
    }

    const { first, last } = getNameParts(editItem?.name || '')

    const defaultValues: UserFormValues = {
        id: editItem?.id,
        email: editItem?.email || '',
        firstName: editItem ? first : '',
        lastName: editItem ? last : '',
        initials: editItem?.initials || '',
        designation: editItem?.designation || '',
        avatar: editItem?.avatar || '',
        managerId: editItem?.managerId,
        role: editItem?.role || 'READ_ONLY',
        teams: editItem?.teams || [],
        isActive: editItem?.isActive ?? true
    }

    const form = useForm<UserFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(adminUserSchema) as any,
        defaultValues
    })

    // Auto-generate Initials
    const firstName = form.watch('firstName')
    const lastName = form.watch('lastName')

    useEffect(() => {
        // Only generate initials if both exist and initials field is pristine or empty (optional refinement)
        // Original logic:
        const f = firstName || ''
        const l = lastName || ''
        let generated = ''
        if (f && l) generated = (f[0] + l[0]).toUpperCase()
        else if (f) generated = f.substring(0, 2).toUpperCase()

        if (generated) form.setValue('initials', generated, { shouldValidate: true })
    }, [firstName, lastName, form])

    useEffect(() => { form.reset(defaultValues) }, [editItem])

    const [pendingData, setPendingData] = useState<UserFormValues | null>(null)
    const [showConfirm, setShowConfirm] = useState(false)
    const [confirmType, setConfirmType] = useState<'missing_info' | 'disable_user'>('missing_info')
    const [isSaving, setIsSaving] = useState(false)

    const processSave = async (data: UserFormValues) => {
        setIsSaving(true)
        try {
            const res = await handleSave(data)
            if (res && !res.success && res.errors) {
                Object.entries(res.errors).forEach(([key, message]) => {
                    form.setError(key as keyof UserFormValues, { type: 'manual', message: message as string })
                })
            }
            return res
        } finally {
            setIsSaving(false)
        }
    }

    const onSubmit = async (data: UserFormValues) => {
        const hasManager = data.managerId && data.managerId !== 0
        const hasTeams = data.teams && data.teams.length > 0
        const isDisabling = editItem?.isActive && !data.isActive

        if (isDisabling) {
            setPendingData(data)
            setConfirmType('disable_user')
            setShowConfirm(true)
            return
        }

        if ((!hasManager || !hasTeams) && !editItem?.id) {
            setPendingData(data)
            setConfirmType('missing_info')
            setShowConfirm(true)
            return
        } else if (!hasManager || !hasTeams) {
            setPendingData(data)
            setConfirmType('missing_info')
            setShowConfirm(true)
            return
        }

        data.name = `${data.firstName} ${data.lastName || ''}`.trim()
        await processSave(data)
    }

    const handleConfirmProceed = async () => {
        setShowConfirm(false)
        if (pendingData) {
            const finalData = { ...pendingData }
            finalData.name = `${finalData.firstName} ${finalData.lastName || ''}`.trim()
            await processSave(finalData)
            setPendingData(null)
        }
    }

    return {
        form,
        showConfirm,
        setShowConfirm,
        confirmType,
        handleConfirmProceed,
        onSubmit,
        isSaving
    }
}
