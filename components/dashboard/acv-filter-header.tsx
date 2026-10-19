'use client'

import { useState, useEffect, useRef } from 'react'
import { Filter } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { useAcvFormat } from '@/hooks/use-acv-format'
import { FieldConfig } from '@/types'

interface AcvFilterHeaderProps {
    min: number
    max: number
    filters: Record<string, string>
    handleFilterChange: (field: string, value: string) => void
    handleBulkFilterChange: (changes: Record<string, string | null>) => void
    config?: {
        global: FieldConfig[]
        user: {
            currency?: string | null
            acvUnit?: string | null
            acvDecimals?: string | null
        }
    }
}

export function AcvFilterHeader({
    min = 0,
    max = 10000000, // Default max, should be dynamic ideally
    filters,
    handleFilterChange,
    handleBulkFilterChange,
    config
}: AcvFilterHeaderProps) {
    const [open, setOpen] = useState(false)
    const [range, setRange] = useState<[number, number]>([min, max])
    const { formatAcv } = useAcvFormat()
    // Only commit to the URL when the user actually moved the slider, so that
    // faceted bound changes (new min/max) don't inject spurious filters.
    const userInteractedRef = useRef(false)

    // Sync range from filters (active selection) or the current facet bounds.
    useEffect(() => {
        const currentMin = filters['annualContractValue_min'] ? parseInt(filters['annualContractValue_min']) : min
        const currentMax = filters['annualContractValue_max'] ? parseInt(filters['annualContractValue_max']) : max
        setRange([currentMin, currentMax])
    }, [filters, min, max])

    // eslint-disable-next-line react-hooks/set-state-in-effect -- useDebounce schedules setState via setTimeout, not synchronously in the effect body
    const debouncedRange = useDebounce(range, 500)

    useEffect(() => {
        if (!userInteractedRef.current) return

        const currentMin = filters['annualContractValue_min'] ? parseInt(filters['annualContractValue_min']) : min
        const currentMax = filters['annualContractValue_max'] ? parseInt(filters['annualContractValue_max']) : max

        if ((debouncedRange[0] !== currentMin || debouncedRange[1] !== currentMax)) {
            handleBulkFilterChange({
                'annualContractValue_min': debouncedRange[0].toString(),
                'annualContractValue_max': debouncedRange[1].toString()
            })
        }
        userInteractedRef.current = false
    }, [debouncedRange, handleBulkFilterChange, filters, min, max])

    const isActive = !!filters['annualContractValue_min'] || !!filters['annualContractValue_max']

    const clearFilter = (e: React.MouseEvent) => {
        e.stopPropagation()
        userInteractedRef.current = false
        setRange([min, max])
        handleBulkFilterChange({
            'annualContractValue_min': null,
            'annualContractValue_max': null
        })
        setOpen(false)
    }

    // Helper for Header Title
    const getHeaderTitle = () => {
        const currency = config?.user.currency || config?.global?.find((c) => c.targetField === 'acv')?.prefix || '$'
        const unit = config?.user.acvUnit || config?.global?.find((c) => c.targetField === 'acv')?.fieldName || 'ACTUAL'

        if (unit === 'THOUSANDS') return `ACV (${currency}K)`
        if (unit === 'MILLIONS') return `ACV (${currency}M)`
        if (unit === 'BILLIONS') return `ACV (${currency}B)`

        return `ACV (${currency})`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className={cn(
                    "flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 rounded px-1 active:bg-muted transition-colors group whitespace-nowrap",
                    open && "bg-muted/50"
                )}>
                    <span>{getHeaderTitle()}</span>
                    <button className={cn(
                        "transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground/50 hover:text-foreground"
                    )}>
                        <Filter className="h-3 w-3" fill={isActive ? "currentColor" : "none"} />
                    </button>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium leading-none">Filter ACV</h4>
                        {isActive && (
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive" onClick={clearFilter}>
                                Reset
                            </Button>
                        )}
                    </div>
                    <div className="pt-4">
                        <Slider
                            defaultValue={[min, max]}
                            value={range}
                            min={min}
                            max={max}
                            step={100} // Dynamic step?
                            onValueChange={(vals) => {
                                userInteractedRef.current = true
                                setRange([vals[0], vals[1]])
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatAcv(range[0], config?.user, config?.global?.find((c) => c.targetField === 'acv'))}</span>
                        <span>{formatAcv(range[1], config?.user, config?.global?.find((c) => c.targetField === 'acv'))}</span>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
