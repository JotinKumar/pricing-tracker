'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FilterTrigger } from './filter-trigger'
import { LocationFilterHeaderProps } from './filter-types'

export function LocationFilterHeader({ 
    lookups, 
    filters, 
    activeFilter, 
    setActiveFilter, 
    handleFilterChange, 
    handleBulkFilterChange 
}: LocationFilterHeaderProps) {
    const isActive = activeFilter === 'locations'
    const hasValue = filters['clientLocationIds'] || filters['deliveryLocationIds']

    return (
        <th className="px-4 py-3 align-middle w-[10%] relative group sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border">
            <Popover open={isActive} onOpenChange={(open) => setActiveFilter(open ? 'locations' : null)}>
                <PopoverTrigger asChild>
                    <div><FilterTrigger label="Location" isActive={isActive} hasValue={hasValue} /></div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                        <div>
                            <div className="mb-1 font-semibold text-xs text-foreground">Client Location</div>
                            <Select
                                value={filters['clientLocationIds'] || 'all'}
                                onValueChange={(value) => handleFilterChange('clientLocationIds', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {lookups.locations.map((l) => (
                                        <SelectItem key={`cl-${l.id}`} value={String(l.id)}>{l.country}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <div className="mb-1 font-semibold text-xs text-foreground">Delivery Location</div>
                            <Select
                                value={filters['deliveryLocationIds'] || 'all'}
                                onValueChange={(value) => handleFilterChange('deliveryLocationIds', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {lookups.locations.map((l) => (
                                        <SelectItem key={`dl-${l.id}`} value={String(l.id)}>{l.country}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {(filters['clientLocationIds'] || filters['deliveryLocationIds']) && (
                            <div className="pt-2 border-t border-border">
                                <Button
                                    variant="ghost"
                                    className="w-full h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => {
                                        if (handleBulkFilterChange) {
                                            handleBulkFilterChange({ clientLocationIds: '', deliveryLocationIds: '' })
                                        } else {
                                            handleFilterChange('clientLocationIds', '');
                                            handleFilterChange('deliveryLocationIds', '')
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
