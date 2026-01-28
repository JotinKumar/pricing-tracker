'use client'

import { UserModal } from './user-modal'
import { LookupModal } from './lookup-modal'
import { AdminUserFormValues, AdminLookupFormValues, ApiResponse, Team } from '@/types'

interface AdminModalProps {
    editItem: AdminUserFormValues | AdminLookupFormValues | null
    activeTab: string
    fields: { key: string; label: string }
    handleSave: (data: AdminUserFormValues | AdminLookupFormValues) => Promise<ApiResponse>
    onClose: () => void
    data: (AdminUserFormValues | AdminLookupFormValues)[]
    availableTeams?: Team[]
    defaultCurrency?: string
}

export function AdminModal({ editItem, activeTab, fields, handleSave, onClose, data, availableTeams = [], defaultCurrency = '$' }: AdminModalProps) {
    const isUserTab = activeTab === 'User'

    if (isUserTab) {
        return (
            <UserModal
                editItem={editItem as AdminUserFormValues | null}
                handleSave={handleSave as (data: AdminUserFormValues) => Promise<ApiResponse>}
                onClose={onClose}
                data={data as AdminUserFormValues[]}
                availableTeams={availableTeams}
            />
        )
    }

    return (
        <LookupModal
            editItem={editItem as AdminLookupFormValues | null}
            activeTab={activeTab}
            fields={fields}
            handleSave={handleSave as (data: AdminLookupFormValues) => Promise<ApiResponse>}
            onClose={onClose}
            data={data as AdminLookupFormValues[]}
            defaultCurrency={defaultCurrency}
        />
    )
}
