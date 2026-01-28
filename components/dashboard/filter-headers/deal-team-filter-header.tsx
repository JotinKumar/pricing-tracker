'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FilterTrigger } from './filter-trigger'
import { DealTeamFilterHeaderProps } from './filter-types'
import { useMemo } from 'react'

export function DealTeamFilterHeader({ 
    activities, 
    filters, 
    activeFilter, 
    setActiveFilter, 
    handleFilterChange, 
    handleBulkFilterChange 
}: DealTeamFilterHeaderProps) {
    const isActive = activeFilter === 'dealTeam'

    const teamsFromActivities = useMemo(() => 
        Array.from(new Set(
            activities.flatMap(a => a.teamMembers?.map((tm) => tm.team.teamname) || [])
        )) as string[],
        [activities]
    )

    const teamsWithActiveFilters = useMemo(() => 
        Object.keys(filters)
            .filter(k => k.startsWith('team_') && filters[k])
            .map(k => k.replace('team_', '')),
        [filters]
    )

    const allTeamNames = useMemo(() => {
        const teamOrder = ['Pricing', 'Sales', 'Solutions', 'Business Finance']
        const allTeamNamesSet = new Set([...teamsFromActivities, ...teamsWithActiveFilters])
        return teamOrder.filter(t => allTeamNamesSet.has(t))
            .concat([...allTeamNamesSet].filter(t => !teamOrder.includes(t)).sort())
    }, [teamsFromActivities, teamsWithActiveFilters])

    const activeTeamFilters = useMemo(() => 
        allTeamNames.filter(t => filters[`team_${t}`]),
        [allTeamNames, filters]
    )
    const hasValue = activeTeamFilters.length > 0

    return (
        <th className="px-4 py-3 align-middle w-[10%] relative group sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border">
            <Popover open={isActive} onOpenChange={(open) => setActiveFilter(open ? 'dealTeam' : null)}>
                <PopoverTrigger asChild>
                    <div><FilterTrigger label="Deal Team" isActive={isActive} hasValue={hasValue} /></div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 max-h-[60vh] overflow-y-auto" align="start">
                    <div className="space-y-3">
                        {allTeamNames.map(teamName => {
                            const usersInTeam = Array.from(new Set(
                                activities.flatMap(a =>
                                    a.teamMembers?.filter((tm) => tm.team.teamname === teamName).map((tm) => tm.user.name) || []
                                )
                            )).filter(Boolean).sort()

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
                                            <SelectItem value="Unassigned" className="text-muted-foreground italic">Unassigned</SelectItem>
                                            {usersInTeam.map((u) => (
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
                                            const resetObj: Record<string, string> = {}
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
