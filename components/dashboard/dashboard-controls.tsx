'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

interface DashboardControlsProps {
    search: string
    setSearch: (value: string) => void
    groupBy: 'client' | 'vertical'
    setGroupBy: (value: 'client' | 'vertical') => void
    viewMode: 'pipeline' | 'closed' | 'inactive'
    setViewMode: (value: 'pipeline' | 'closed' | 'inactive') => void
    isReadOnly: boolean
    handleCreate: () => void
    hasActiveFilters: boolean
    clearAllFilters: () => void
    showAutoAdded: boolean
    setShowAutoAdded: (value: boolean) => void
}

export function DashboardControls({
    search,
    setSearch,
    groupBy,
    setGroupBy,
    viewMode,
    setViewMode,
    isReadOnly,
    handleCreate,
    hasActiveFilters,
    clearAllFilters,
    showAutoAdded,
    setShowAutoAdded
}: DashboardControlsProps) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full items-center gap-3">
                    <Input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border-none bg-card px-4 py-2 text-xs shadow-sm ring-1 ring-border transition focus:ring-2 focus:ring-ring sm:max-w-xs text-foreground placeholder:text-muted-foreground mr-2 h-9"
                    />
                    {hasActiveFilters && (
                        <Button
                            onClick={clearAllFilters}
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 h-9 px-3 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 whitespace-nowrap"
                        >
                            <X className="h-3.5 w-3.5" /> Clear Filters
                        </Button>
                    )}
                    <div className="flex-1"></div>

                    <div className="flex items-center rounded-lg border border-border bg-muted p-1 gap-1">
                        {['client', 'vertical'].map((type) => (
                            <Button
                                key={type}
                                onClick={() => setGroupBy(type as 'client' | 'vertical')}
                                variant={groupBy === type ? 'default' : 'ghost'}
                                size="sm"
                                className={`px-3 py-1.5 h-8 text-xs font-bold transition ${groupBy === type ? 'bg-card text-primary shadow hover:bg-card/90' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}`}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Button>
                        ))}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center rounded-lg border border-border bg-muted p-1 gap-1">
                        {['pipeline', 'closed', 'inactive'].map((mode) => (
                            <Button
                                key={mode}
                                onClick={() => setViewMode(mode as 'pipeline' | 'closed' | 'inactive')}
                                variant={viewMode === mode ? 'default' : 'ghost'}
                                size="sm"
                                className={`px-3 py-1.5 h-8 text-xs font-bold transition ${viewMode === mode ? 'bg-card text-primary shadow hover:bg-card/90' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}`}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </Button>
                        ))}
                    </div>

                    {/* Show Auto-Added Members toggle */}
                    <div className="flex items-center space-x-2 px-2">
                        <Checkbox id="showAutoAdded" checked={showAutoAdded} onCheckedChange={(c) => setShowAutoAdded(!!c)} />
                        <Label htmlFor="showAutoAdded" className="text-xs font-medium text-muted-foreground cursor-pointer whitespace-nowrap">
                            Show auto-added
                        </Label>
                    </div>

                    {/* New Activity Button - Hidden for Read Only */}
                    {!isReadOnly && (
                        <Button onClick={handleCreate} className="gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 h-9">
                            + New Activity
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
