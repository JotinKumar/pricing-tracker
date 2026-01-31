'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FilterTrigger } from './filter-trigger'
import { ProjectFilterHeaderProps } from './filter-types'
import { useMemo, useState, useEffect } from 'react'
import { getFieldConfigs } from '@/lib/actions/field-config'
import { FieldConfig } from '@/types'
import { useIdFormat } from '@/hooks/use-id-format'

// Default field configurations
const DEFAULT_CONFIGS: Record<string, FieldConfig> = {
    id1: { fieldName: 'ID1', fieldType: 'STRING', prefix: '', hasPrefix: false, isActive: true, displayOnDashboard: true },
    id2: { fieldName: 'ID2', fieldType: 'STRING', prefix: '', hasPrefix: false, isActive: true, displayOnDashboard: true },
}

export function ProjectFilterHeader({
    activities,
    lookups,
    filters,
    activeFilter,
    setActiveFilter,
    handleFilterChange,
    handleBulkFilterChange,
    config
}: ProjectFilterHeaderProps) {
    const isActive = activeFilter === 'project'
    const hasValue = filters['clientName'] || filters['verticalId'] || filters['id1'] || filters['id2']

    // Config Logic similar to ActivityRow
    const [clientConfigs, setClientConfigs] = useState<Record<string, FieldConfig>>(DEFAULT_CONFIGS)
    const { formatId } = useIdFormat()

    useEffect(() => {
        if (!config) {
            getFieldConfigs().then(res => {
                if (res.success && res.data) {
                    const map: Record<string, FieldConfig> = {}
                    res.data.forEach((c: FieldConfig) => map[c.targetField || ''] = c)
                    setClientConfigs(prev => ({ ...prev, ...map }))
                }
            })
        }
    }, [config])

    const configs = useMemo(() => {
        if (config?.global) {
            const map: Record<string, any> = {}
            config.global.forEach((c: any) => map[c.targetField] = c)
            return map
        }
        return clientConfigs
    }, [config, clientConfigs])


    const uniqueClients = useMemo(() =>
        Array.from(new Set(activities.map(a => a.clientName).filter(Boolean))).sort(),
        [activities]
    )

    return (
        <th className="px-4 py-3 align-middle w-[30%] relative group sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border">
            <Popover open={isActive} onOpenChange={(open) => setActiveFilter(open ? 'project' : null)}>
                <PopoverTrigger asChild>
                    <div><FilterTrigger label="Project Name" isActive={isActive} hasValue={hasValue} /></div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                        {(filters['id1'] || filters['id2']) && (
                            <div className="space-y-2 pb-2 border-b border-border">
                                <div className="font-semibold text-xs text-foreground">Active ID Filters</div>
                                {filters['id1'] && (
                                    <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1.5">
                                        <span className="text-xs">
                                            <span className="text-muted-foreground">{configs.id1?.fieldName || 'ID1'}:</span>{' '}
                                            <span className="font-medium">{formatId(filters['id1'], configs.id1)}</span>
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleFilterChange('id1', '')}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                )}
                                {filters['id2'] && (
                                    <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1.5">
                                        <span className="text-xs">
                                            <span className="text-muted-foreground">{configs.id2?.fieldName || 'ID2'}:</span>{' '}
                                            <span className="font-medium">{formatId(filters['id2'], configs.id2)}</span>
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleFilterChange('id2', '')}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <div className="mb-1 font-semibold text-xs text-foreground">Client</div>
                            <Select
                                value={filters['clientName'] || 'all'}
                                onValueChange={(value) => handleFilterChange('clientName', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {uniqueClients.map((n) => (
                                        <SelectItem key={n} value={n}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <div className="mb-1 font-semibold text-xs text-foreground">Vertical</div>
                            <Select
                                value={filters['verticalId'] || 'all'}
                                onValueChange={(value) => handleFilterChange('verticalId', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {lookups.verticals.map((v) => (
                                        <SelectItem key={v.id} value={String(v.id)}>{v.vertical}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(filters['clientName'] || filters['verticalId'] || filters['id1'] || filters['id2']) && (
                            <div className="pt-2 border-t border-border">
                                <Button
                                    variant="ghost"
                                    className="w-full h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => {
                                        if (handleBulkFilterChange) {
                                            handleBulkFilterChange({ clientName: '', verticalId: '', id1: '', id2: '' })
                                        } else {
                                            handleFilterChange('clientName', '');
                                            handleFilterChange('verticalId', '');
                                            handleFilterChange('id1', '');
                                            handleFilterChange('id2', '');
                                        }
                                        setActiveFilter(null);
                                    }}
                                >
                                    Clear All
                                </Button>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </th>
    )
}
