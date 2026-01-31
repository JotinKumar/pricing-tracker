
import { useCallback } from 'react'
import { FieldConfig } from '@/types'

export function useIdFormat() {
    const formatId = useCallback((val: string | null, config: any) => {
        if (!val) return ''
        const prefix = config?.hasPrefix ? config?.prefix : ''
        if (prefix && val.startsWith(prefix)) return val
        return `${prefix}${val}`
    }, [])

    return { formatId }
}
