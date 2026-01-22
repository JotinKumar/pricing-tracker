'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface DashboardControlsProps {
    search: string
    setSearch: (value: string) => void
    groupBy: 'client' | 'vertical'
    setGroupBy: (value: 'client' | 'vertical') => void
    viewMode: 'pipeline' | 'closed' | 'inactive'
    setViewMode: (value: 'pipeline' | 'closed' | 'inactive') => void
    isReadOnly: boolean
    handleCreate: () => void
}

export function DashboardControls({
    search,
    setSearch,
    groupBy,
    setGroupBy,
    viewMode,
    setViewMode,
    isReadOnly,
    handleCreate
}: DashboardControlsProps) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="mb-4 text-lg font-bold text-foreground">Projects</h2>
            <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full items-center gap-3">
                    <Input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border-none bg-card px-4 py-2 text-xs shadow-sm ring-1 ring-border transition focus:ring-2 focus:ring-ring sm:max-w-xs text-foreground placeholder:text-muted-foreground mr-2 h-9"
                    />
                    <div className="flex-1"></div>

                    <div className="flex items-center rounded-lg border border-border bg-muted p-1 gap-1">
                        {['client', 'vertical'].map((type) => (
                            <Button
                                key={type}
                                onClick={() => setGroupBy(type as 'client' | 'vertical')}
                                variant={groupBy === type ? 'default' : 'ghost'}
                                size="sm"
                                className={`px-3 py-1.5 h-8 text-xs font-bold transition ${groupBy === type ? 'bg-background text-primary shadow-sm hover:bg-background/90' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}`}
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
                                className={`px-3 py-1.5 h-8 text-xs font-bold transition ${viewMode === mode ? 'bg-background text-primary shadow-sm hover:bg-background/90' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}`}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </Button>
                        ))}
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
