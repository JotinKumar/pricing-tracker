'use client'

import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { useAcvFormat } from '@/hooks/use-acv-format'

interface AcvFilterHeaderProps {
    min: number
    max: number
    filters: Record<string, string>
    handleFilterChange: (field: string, value: string) => void
    handleBulkFilterChange: (changes: Record<string, string | null>) => void
    config?: {
        global: any[]
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

    // Load initial values from filters
    useEffect(() => {
        const currentMin = filters['annualContractValue_min'] ? parseInt(filters['annualContractValue_min']) : min
        const currentMax = filters['annualContractValue_max'] ? parseInt(filters['annualContractValue_max']) : max
        setRange([currentMin, currentMax])
    }, [filters, min, max])

    const debouncedRange = useDebounce(range, 500)

    useEffect(() => {
        // Only trigger update if values are different from current filters and popover is open or values changed
        const currentMin = filters['annualContractValue_min'] ? parseInt(filters['annualContractValue_min']) : min
        const currentMax = filters['annualContractValue_max'] ? parseInt(filters['annualContractValue_max']) : max

        if ((debouncedRange[0] !== currentMin || debouncedRange[1] !== currentMax)) {
            handleBulkFilterChange({
                'annualContractValue_min': debouncedRange[0].toString(),
                'annualContractValue_max': debouncedRange[1].toString()
            })
        }
    }, [debouncedRange, handleBulkFilterChange, filters, min, max])

    const isActive = !!filters['annualContractValue_min'] || !!filters['annualContractValue_max']

    const clearFilter = (e: React.MouseEvent) => {
        e.stopPropagation()
        setRange([min, max])
        handleBulkFilterChange({
            'annualContractValue_min': null,
            'annualContractValue_max': null
        })
        setOpen(false)
    }

    // Helper for Header Title
    const getHeaderTitle = () => {
        const currency = config?.user.currency || config?.global?.find((c: any) => c.targetField === 'acv')?.prefix || '$'
        const unit = config?.user.acvUnit || config?.global?.find((c: any) => c.targetField === 'acv')?.fieldName || 'ACTUAL'

        if (unit === 'THOUSANDS') return `ACV (${currency}K)`
        if (unit === 'MILLIONS') return `ACV (${currency}M)`
        if (unit === 'BILLIONS') return `ACV (${currency}B)`

        return `ACV (${currency})`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className={cn(
                    "flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 rounded px-1 active:bg-muted transition-colors group",
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
                            onValueChange={(vals) => setRange([vals[0], vals[1]])}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatAcv(range[0], config?.user, config?.global?.find((c: any) => c.targetField === 'acv'))}</span>
                        <span>{formatAcv(range[1], config?.user, config?.global?.find((c: any) => c.targetField === 'acv'))}</span>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
