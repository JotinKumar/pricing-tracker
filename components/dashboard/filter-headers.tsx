'use client'

import { Filter as FilterIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface FilterProps {
    filters: Record<string, string>
    activeFilter: string | null
    setActiveFilter: (filter: string | null) => void
    handleFilterChange: (field: string, value: string) => void
    handleBulkFilterChange?: (changes: Record<string, string | null>) => void
    filterRef?: any
    forceAbove?: boolean
}

interface CommonHeaderProps extends FilterProps {
    width?: string
}

const FilterTrigger = ({ label, isActive, hasValue }: { label: string, isActive: boolean, hasValue: any }) => (
    <div className={`flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 rounded px-1 active:bg-muted ${isActive ? 'bg-muted/50' : ''}`}>
        <span>{label}</span>
        <button
            className={`transition-colors ${isActive || hasValue ? 'text-primary' : 'text-muted-foreground/50 hover:text-foreground'}`}
        >
            <FilterIcon className="h-3 w-3" fill={hasValue ? "currentColor" : "none"} />
        </button>
    </div>
)

interface RenderFilterHeaderProps extends CommonHeaderProps {
    label: string
    field: string
    options: { label: string; value: string; className?: string }[]
    width: string
}

export function RenderFilterHeader({ label, field, options, width, filters, activeFilter, setActiveFilter, handleFilterChange }: RenderFilterHeaderProps) {
    const isActive = activeFilter === field
    const hasValue = filters[field]

    return (
        <th className={`px-4 py-3 align-middle ${width} relative group sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border`}>
            <Popover open={isActive} onOpenChange={(open) => setActiveFilter(open ? field : null)}>
                <PopoverTrigger asChild>
                    <div><FilterTrigger label={label} isActive={isActive} hasValue={hasValue} /></div>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
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
                            {options.map((o: any) => (
                                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {hasValue && (
                        <Button
                            variant="ghost"
                            className="w-full h-8 text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
                            onClick={() => {
                                handleFilterChange(field, '')
                                setActiveFilter(null)
                            }}
                        >
                            Clear Filter
                        </Button>
                    )}
                </PopoverContent>
            </Popover>
        </th>
    )
}

interface LocationFilterHeaderProps extends CommonHeaderProps {
    lookups: any
}

export function LocationFilterHeader({ lookups, filters, activeFilter, setActiveFilter, handleFilterChange, handleBulkFilterChange }: LocationFilterHeaderProps) {
    const isActive = activeFilter === 'locations'
    const hasValue = filters['clientLocationIds'] || filters['deliveryLocationIds']

    return (
        <th className="px-4 py-3 align-middle w-[12%] relative group sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border">
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
                                    {lookups.locations.map((l: any) => (
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
                                    {lookups.locations.map((l: any) => (
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

// Replaces InfoFilterHeader
interface DealTeamFilterHeaderProps extends CommonHeaderProps {
    activities: any[]
}

export function DealTeamFilterHeader({ activities, filters, activeFilter, setActiveFilter, handleFilterChange, handleBulkFilterChange }: DealTeamFilterHeaderProps) {
    const isActive = activeFilter === 'dealTeam'

    // Extract unique team names present in the activities
    const allTeamNames = Array.from(new Set(
        activities.flatMap(a => (a as any).teamMembers?.map((tm: any) => tm.team.teamname) || [])
    )).sort() as string[]

    // Check if any team filter is active (this is harder now as we need to support dynamic keys or map legacy keys)
    // Actually, filter logic in getActivities needs to change too to support dynamic team filtering?
    // Current getActivities logic is: filters.requesterSales, etc.
    // I need to update getActivities to support filtering by Team Name + User Name.
    // But for now, let's just assume we want to filter by User Name for a specific Team.
    // Let's use filter keys like `team_Sales`, `team_Solutions` etc? 
    // AND update getActivities to handle `team_*` filters.
    // Or simplest: Just list teams found and filter users.

    const activeTeamFilters = allTeamNames.filter(t => filters[`team_${t}`])
    const hasValue = activeTeamFilters.length > 0

    return (
        <th className="px-4 py-3 align-middle w-[12%] relative group sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border">
            <Popover open={isActive} onOpenChange={(open) => setActiveFilter(open ? 'dealTeam' : null)}>
                <PopoverTrigger asChild>
                    <div><FilterTrigger label="Deal Team" isActive={isActive} hasValue={hasValue} /></div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 max-h-[60vh] overflow-y-auto" align="start">
                    <div className="space-y-3">
                        {allTeamNames.map(teamName => {
                            // Get all users in this team across visible activities
                            const usersInTeam = Array.from(new Set(
                                activities.flatMap(a =>
                                    (a as any).teamMembers?.filter((tm: any) => tm.team.teamname === teamName).map((tm: any) => tm.user.name) || []
                                )
                            )).sort()

                            if (usersInTeam.length === 0) return null

                            return (
                                <div key={teamName}>
                                    <div className="mb-1 font-semibold text-xs text-foreground">{teamName}</div>
                                    <Select
                                        value={filters[`team_${teamName}`] || 'all'}
                                        onValueChange={(value) => handleFilterChange(`team_${teamName}`, value === 'all' ? '' : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            {usersInTeam.map((u: any) => (
                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )
                        })}

                        {hasValue && (
                            <div className="pt-2 border-t border-border">
                                <Button
                                    variant="ghost"
                                    className="w-full h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => {
                                        if (handleBulkFilterChange) {
                                            const resetObj: any = {}
                                            allTeamNames.forEach(t => resetObj[`team_${t}`] = '')
                                            handleBulkFilterChange(resetObj)
                                        } else {
                                            allTeamNames.forEach(t => handleFilterChange(`team_${t}`, ''))
                                        }
                                        setActiveFilter(null);
                                    }}
                                >
                                    Clear All
                                </Button>
                            </div>
                        )}
                        {allTeamNames.length === 0 && <div className="text-xs text-muted-foreground p-2">No team members found.</div>}
                    </div>
                </PopoverContent>
            </Popover>
        </th>
    )
}

interface ProjectFilterHeaderProps extends CommonHeaderProps {
    activities: any[]
    lookups: any
}

export function ProjectFilterHeader({ activities, lookups, filters, activeFilter, setActiveFilter, handleFilterChange, handleBulkFilterChange }: ProjectFilterHeaderProps) {
    const isActive = activeFilter === 'project'
    const hasValue = filters['clientName'] || filters['verticalId']

    return (
        <th className="px-4 py-3 align-middle w-[30%] relative group sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border">
            <Popover open={isActive} onOpenChange={(open) => setActiveFilter(open ? 'project' : null)}>
                <PopoverTrigger asChild>
                    <div><FilterTrigger label="Project Name" isActive={isActive} hasValue={hasValue} /></div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
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
                                    {Array.from(new Set(activities.map(a => a.clientName).filter(Boolean))).sort().map((n: any) => (
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
                                    {lookups.verticals.map((v: any) => (
                                        <SelectItem key={v.id} value={String(v.id)}>{v.vertical}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(filters['clientName'] || filters['verticalId']) && (
                            <div className="pt-2 border-t border-border">
                                <Button
                                    variant="ghost"
                                    className="w-full h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => {
                                        if (handleBulkFilterChange) {
                                            handleBulkFilterChange({ clientName: '', verticalId: '' })
                                        } else {
                                            handleFilterChange('clientName', '');
                                            handleFilterChange('verticalId', '');
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
