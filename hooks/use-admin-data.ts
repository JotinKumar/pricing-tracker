import { useState, useEffect, useMemo } from 'react'
import { getAdminData } from '@/lib/actions/admin'
import { AdminUserFormValues, AdminLookupFormValues } from '@/lib/schemas'

type TabType = 'User' | 'Team' | 'Vertical' | 'Subvertical' | 'Horizontal' | 'Location' | 'Category' | 'Version' | 'Status' | 'Outcome' | 'DocumentType' | 'SalesforceStage' | 'Defaults' | 'Preferences'

// Shape used for heterogeneous search filtering across admin rows.
interface AdminSearchRow {
    id?: number
    name?: string | null
    display?: string | null
    shortName?: string | null
    email?: string | null
    [key: string]: unknown
}

interface UseAdminDataProps {
    activeTab: TabType
    searchTerm: string
    fields: {
        key: string
        label: string
    }
    onError: (message: string) => void
}

export function useAdminData({ activeTab, searchTerm, fields, onError }: UseAdminDataProps) {
    const [data, setData] = useState<(AdminUserFormValues | AdminLookupFormValues)[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Settings/Defaults/Preferences don't need generic fetch
        if (activeTab !== 'Defaults' && activeTab !== 'Preferences') {
            fetchData()
        }
    }, [activeTab])

    const fetchData = async () => {
        setLoading(true)
        const result = await getAdminData(activeTab as Exclude<TabType, 'Defaults' | 'Preferences'>)
        if (result.success) {
            setData((result.data as (AdminUserFormValues | AdminLookupFormValues)[]) || [])
        } else {
            onError(result.message || 'Error fetching data')
        }
        setLoading(false)
    }

    // Memoized filtered data for performance
    // eslint-disable-next-line react-hooks/immutability -- useMemo over already-declared state (data, searchTerm)
    const filteredData = useMemo(() => {
        if (!searchTerm) return data

        const searchLower = searchTerm.toLowerCase()

        return data.filter(item => {
            const row = item as unknown as AdminSearchRow

            // Search in ID
            if (typeof row.id !== 'undefined' && String(row.id).includes(searchLower)) return true

            // Search in Name/Key
            if (typeof row.name === 'string' && row.name.toLowerCase().includes(searchLower)) return true
            const keyed = row[fields.key]
            if (keyed != null && String(keyed).toLowerCase().includes(searchLower)) return true

            // Search in Display/Initials
            if (typeof row.display === 'string' && row.display.toLowerCase().includes(searchLower)) return true
            if (typeof row.shortName === 'string' && row.shortName.toLowerCase().includes(searchLower)) return true

            // Search in Email (User)
            if (typeof row.email === 'string' && row.email.toLowerCase().includes(searchLower)) return true

            return false
        })
    }, [data, searchTerm, fields.key])

    return {
        data,
        filteredData,
        loading,
        refetch: fetchData
    }
}
