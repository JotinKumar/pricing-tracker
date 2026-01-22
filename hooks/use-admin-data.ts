import { useState, useEffect, useMemo } from 'react'
import { getAdminData } from '@/lib/actions/admin'

type TabType = 'User' | 'Team' | 'Vertical' | 'Horizontal' | 'Location' | 'Category' | 'Version' | 'Status' | 'Outcome' | 'DocumentType' | 'Defaults'

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
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Settings/Defaults don't need generic fetch
        if (activeTab !== 'Defaults') {
            fetchData()
        }
    }, [activeTab])

    const fetchData = async () => {
        setLoading(true)
        const result = await getAdminData(activeTab as any)
        if (result.success) {
            setData(result.data || [])
        } else {
            onError(result.message || 'Error fetching data')
        }
        setLoading(false)
    }

    // Memoized filtered data for performance
    const filteredData = useMemo(() => {
        if (!searchTerm) return data
        
        const searchLower = searchTerm.toLowerCase()

        return data.filter(item => {
            // Search in ID
            if (String(item.id).includes(searchLower)) return true

            // Search in Name/Key
            if (item.name && item.name.toLowerCase().includes(searchLower)) return true
            if (item[fields.key] && String(item[fields.key]).toLowerCase().includes(searchLower)) return true

            // Search in Display/Initials
            if (item.display && item.display.toLowerCase().includes(searchLower)) return true
            if (item.shortName && item.shortName.toLowerCase().includes(searchLower)) return true

            // Search in Email (User)
            if (item.email && item.email.toLowerCase().includes(searchLower)) return true

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
