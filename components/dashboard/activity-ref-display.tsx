'use client'

import { useState, useEffect } from 'react'
import { getFieldConfigs } from '@/lib/actions/field-config'
import { PricingActivity } from '@/types'

interface ActivityRefDisplayProps {
    activity: PricingActivity
    className?: string
}

export function ActivityRefDisplay({ activity, className }: ActivityRefDisplayProps) {
    const [configs, setConfigs] = useState<Record<string, any>>({
        id1: { fieldName: 'ID1', fieldType: 'STRING', prefix: '', hasPrefix: false, isActive: true, displayOnDashboard: true },
        id2: { fieldName: 'ID2', fieldType: 'STRING', prefix: '', hasPrefix: false, isActive: true, displayOnDashboard: true }
    })
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        getFieldConfigs().then(res => {
            if (res.success && res.data) {
                const map: any = {}
                res.data.forEach((c: any) => map[c.targetField] = c)
                setConfigs(prev => ({ ...prev, ...map }))
                setLoaded(true)
            }
        })
    }, [])

    if (!loaded) return null

    const formatValue = (idRaw: string | undefined | null, config: any) => {
        if (!idRaw) return ''
        const prefix = config.hasPrefix ? config.prefix : ''
        if (prefix && idRaw.startsWith(prefix)) return idRaw
        return `${prefix}${idRaw}`
    }

    const renderId = (key: 'id1' | 'id2', value: string | undefined | null) => {
        const config = configs[key]
        if (!config?.isActive) return null

        const formatted = formatValue(value, config)
        if (!formatted) return null

        // If prefix exists, show just value. Else show Label: Value
        if (config.hasPrefix && config.prefix) {
            return <span>{formatted}</span>
        }
        return <span>{config.fieldName || key.toUpperCase()}: {formatted}</span>
    }

    // Logic: Show ID1 if active. If ID2 also active, show separator.
    const id1 = (activity as any).id1 || (activity as any).salesForceId
    const id2 = (activity as any).id2 || (activity as any).dsrNumber

    const showId1 = configs.id1.isActive && id1
    const showId2 = configs.id2.isActive && id2

    if (!showId1 && !showId2) return null

    return (
        <span className={className}>
            {showId1 && renderId('id1', id1)}
            {showId1 && showId2 && <span className="mx-1 text-muted-foreground/50">/</span>}
            {showId2 && renderId('id2', id2)}
        </span>
    )
}
