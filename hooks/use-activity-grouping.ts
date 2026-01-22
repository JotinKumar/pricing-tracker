
import { useState, useMemo } from 'react'
import { PricingActivity } from '@/types'

export function useActivityGrouping(filteredActivities: PricingActivity[], initialGroupBy: 'client' | 'vertical' = 'client') {
    const [groupBy, setGroupBy] = useState<'client' | 'vertical'>(initialGroupBy)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }))
    }

    const groupedActivities = useMemo(() => {
        return filteredActivities.reduce((acc: Record<string, PricingActivity[]>, curr) => {
            const key = groupBy === 'client' ? (curr.clientName || 'Unknown') : (curr.vertical?.vertical || 'Unknown');
            if (!acc[key]) acc[key] = [];
            acc[key].push(curr);
            return acc;
        }, {});
    }, [filteredActivities, groupBy])

    const groupKeys = useMemo(() => Object.keys(groupedActivities).sort(), [groupedActivities])

    return {
        groupBy, setGroupBy,
        expandedGroups, toggleGroup,
        groupedActivities,
        groupKeys
    }
}
