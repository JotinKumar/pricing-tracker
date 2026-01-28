'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FilterTrigger } from './filter-trigger'
import { RenderFilterHeaderProps } from './filter-types'

export function RenderFilterHeader({ 
    label, 
    field, 
    options, 
    width, 
    filters, 
    activeFilter, 
    setActiveFilter, 
    handleFilterChange, 
    linkedFilter 
}: RenderFilterHeaderProps) {
    const isActive = activeFilter === field
    const hasValue = filters[field] || (linkedFilter && filters[linkedFilter.field])

    const getLinkedFilterLabel = () => {
        if (!linkedFilter || !filters[linkedFilter.field]) return null
        const option = linkedFilter.options.find(o => o.value === filters[linkedFilter.field])
        return option?.label || filters[linkedFilter.field]
    }

    return (
        <th className={`px-4 py-3 align-middle ${width} relative group sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border`}>
            <Popover open={isActive} onOpenChange={(open) => setActiveFilter(open ? field : null)}>
                <PopoverTrigger asChild>
                    <div><FilterTrigger label={label} isActive={isActive} hasValue={hasValue} /></div>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                    {linkedFilter && filters[linkedFilter.field] && (
                        <div className="mb-2 pb-2 border-b border-border">
                            <div className="font-semibold text-xs text-popover-foreground px-1 mb-1">Active {linkedFilter.label} Filter</div>
                            <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1.5">
                                <span className="text-xs font-medium">{getLinkedFilterLabel()}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleFilterChange(linkedFilter.field, '')}
                                >
                                    ×
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="mb-2 font-semibold text-xs text-popover-foreground px-1">{label} Filter</div>
                    <Select
                        value={filters[field] || 'all'}
                        onValueChange={(value) => handleFilterChange(field, value === 'all' ? '' : value)}
                    >
                        <SelectTrigger className="w-full mb-2">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {options.map((o) => (
                                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(hasValue) && (
                        <Button
                            variant="ghost"
                            className="w-full h-8 text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
                            onClick={() => {
                                handleFilterChange(field, '')
                                if (linkedFilter) handleFilterChange(linkedFilter.field, '')
                                setActiveFilter(null)
                            }}
                        >
                            Clear All
                        </Button>
                    )}
                </PopoverContent>
            </Popover>
        </th>
    )
}
