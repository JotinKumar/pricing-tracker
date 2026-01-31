
import { useCallback } from 'react'

interface AcvFormatConfig {
    currency?: string | null
    acvUnit?: string | null
    acvDecimals?: string | null
}

export function useAcvFormat() {
    const formatAcv = useCallback((value: number | null, config?: AcvFormatConfig, fallbackConfig?: any) => {
        const currency = config?.currency || fallbackConfig?.prefix || '$'

        if (value === null || value === undefined) return `${currency}0`

        const format = config?.acvUnit || fallbackConfig?.fieldName || 'ACTUAL'
        const decimalStr = config?.acvDecimals ?? fallbackConfig?.fieldType ?? '0'
        const decimals = parseInt(decimalStr) || 0

        switch (format) {
            case 'THOUSANDS':
                return `${currency}${(value / 1000).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}K`
            case 'MILLIONS':
                return `${currency}${(value / 1000000).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}M`
            case 'BILLIONS':
                return `${currency}${(value / 1000000000).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}B`
            default:
                return `${currency}${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
        }
    }, [])

    return { formatAcv }
}
