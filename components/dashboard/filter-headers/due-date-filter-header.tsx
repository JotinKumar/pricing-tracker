'use client'

import { useState, useEffect, useRef } from 'react'
import { Filter, Calendar } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

interface DueDateFilterHeaderProps {
    filters: Record<string, string>
    handleBulkFilterChange: (changes: Record<string, string | null>) => void
    minDate?: Date | null
    maxDate?: Date | null
}

export function DueDateFilterHeader({
    filters,
    handleBulkFilterChange,
    minDate,
    maxDate
}: DueDateFilterHeaderProps) {
    const [open, setOpen] = useState(false)

    // Calculate dynamic range from DB dates relative to today
    const calculateDaysFromToday = (date: Date | string | null) => {
        if (!date) return null
        const d = new Date(date)
        const today = new Date()
        const diffTime = d.getTime() - today.getTime()
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Default: -60 to 180 if DB empty
    const MIN = minDate ? Math.min(calculateDaysFromToday(minDate) || -60, -30) : -60
    const MAX = maxDate ? Math.max(calculateDaysFromToday(maxDate) || 180, 90) : 180

    const [range, setRange] = useState<[number, number]>([MIN, MAX])
    // Only commit to the URL on real user interaction, so faceted bound changes
    // (new min/max days) don't inject spurious date filters.
    const userInteractedRef = useRef(false)

    // Load from filters (active selection) or the current facet bounds.
    useEffect(() => {
        const currentMin = filters['dueDate_days_min'] ? parseInt(filters['dueDate_days_min']) : MIN
        const currentMax = filters['dueDate_days_max'] ? parseInt(filters['dueDate_days_max']) : MAX
        setRange([currentMin, currentMax])
    }, [filters, MIN, MAX])

    // eslint-disable-next-line react-hooks/set-state-in-effect -- useDebounce schedules setState via setTimeout, not synchronously in the effect body
    const debouncedRange = useDebounce(range, 500)

    useEffect(() => {
        if (!userInteractedRef.current) return

        const currentMin = filters['dueDate_days_min'] ? parseInt(filters['dueDate_days_min']) : MIN
        const currentMax = filters['dueDate_days_max'] ? parseInt(filters['dueDate_days_max']) : MAX

        if (debouncedRange[0] !== currentMin || debouncedRange[1] !== currentMax) {
            handleBulkFilterChange({
                'dueDate_days_min': debouncedRange[0] !== MIN ? debouncedRange[0].toString() : null,
                'dueDate_days_max': debouncedRange[1] !== MAX ? debouncedRange[1].toString() : null
            })
        }
        userInteractedRef.current = false
    }, [debouncedRange, handleBulkFilterChange, filters, MIN, MAX])

    const isActive = !!filters['dueDate_days_min'] || !!filters['dueDate_days_max']

    const clearFilter = (e: React.MouseEvent) => {
        e.stopPropagation()
        userInteractedRef.current = false
        setRange([MIN, MAX])
        handleBulkFilterChange({
            'dueDate_days_min': null,
            'dueDate_days_max': null
        })
        setOpen(false)
    }

    const formatDays = (days: number) => {
        if (days === 0) return 'Today'
        if (days < 0) return `${Math.abs(days)}d Overdue`
        return `${days}d Future`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className={cn(
                    "flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 rounded px-1 active:bg-muted transition-colors group whitespace-nowrap",
                    open && "bg-muted/50"
                )}>
                    <span>Due Date</span>
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
                        <h4 className="font-medium leading-none">Filter Due Date</h4>
                        {isActive && (
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive" onClick={clearFilter}>
                                Reset
                            </Button>
                        )}
                    </div>
                    <div className="pt-8 pb-2 px-2">
                        <Slider
                            defaultValue={[MIN, MAX]}
                            value={range}
                            min={MIN}
                            max={MAX}
                            step={1}
                            onValueChange={(vals) => {
                                userInteractedRef.current = true
                                setRange([vals[0], vals[1]])
                            }}
                            className={cn(range[0] < 0 ? "text-red-500" : "text-primary")}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <div className={cn(range[0] < 0 && "text-red-500 font-bold")}>{formatDays(range[0])}</div>
                        <div className={cn(range[1] < 0 && "text-red-500 font-bold")}>{formatDays(range[1])}</div>
                    </div>
                    <div className="text-[10px] text-center text-muted-foreground/50">
                        Negative values are past due
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
