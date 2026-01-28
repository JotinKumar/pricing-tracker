
'use client'

import { Fragment, useMemo } from 'react'
import { RenderFilterHeader, LocationFilterHeader, DealTeamFilterHeader, ProjectFilterHeader } from './filter-headers'
import { PricingActivity, Lookups } from '@/types'
import { ActivityRow } from './activity-row'

interface ActivityTableProps {
    activities: PricingActivity[]
    groupedActivities: Record<string, PricingActivity[]>
    groupKeys: string[]
    expandedGroups: Record<string, boolean>
    toggleGroup: (groupName: string) => void
    lookups: Lookups
    filters: Record<string, string>
    activeFilter: string | null
    setActiveFilter: (filter: string | null) => void
    handleFilterChange: (field: string, value: string) => void
    handleBulkFilterChange: (changes: Record<string, string | null>) => void
    filterRef: React.RefObject<HTMLDivElement | null>
    groupBy: 'client' | 'vertical'
    getDateColor: (dateStr: string | Date) => string
    getFirstName: (fullName: string | null) => string
    handleInlineUpdate: (activity: PricingActivity, field: string, value: string) => Promise<void>
    handleEdit: (activity: PricingActivity) => void
    handleStorageOpen: (activity: PricingActivity) => void
    handleCommentsOpen: (activity: PricingActivity) => void
    isReadOnly: boolean
    fieldConfigs?: Record<string, unknown>
}

export function ActivityTable({
    activities,
    groupedActivities,
    groupKeys,
    expandedGroups,
    toggleGroup,
    lookups,
    filters,
    activeFilter,
    setActiveFilter,
    handleFilterChange,
    handleBulkFilterChange,
    filterRef,
    groupBy,
    getDateColor,
    getFirstName,
    handleInlineUpdate,
    handleEdit,
    handleStorageOpen,
    handleCommentsOpen,
    isReadOnly,
    fieldConfigs = {}
}: ActivityTableProps) {
    // Memoize expensive calculations
    const totalVisibleRows = useMemo(() => 
        Object.values(groupedActivities).reduce((acc, curr) => acc + curr.length, 0),
        [groupedActivities]
    )
    const forceAbove = totalVisibleRows < 3

    // Memoize options arrays to prevent unnecessary re-renders
    const versionOptions = useMemo(() => 
        lookups.versions.map((v) => ({ 
            label: v.version, 
            value: v.id.toString(), 
            className: "bg-popover text-popover-foreground" 
        })),
        [lookups.versions]
    )

    const categoryOptions = useMemo(() => 
        lookups.categories.map((c) => ({ 
            label: c.category, 
            value: c.id.toString() 
        })),
        [lookups.categories]
    )

    const statusOptions = useMemo(() => 
        lookups.statuses.map((s) => ({ 
            label: s.status, 
            value: s.id.toString(), 
            className: "bg-popover text-popover-foreground" 
        })),
        [lookups.statuses]
    )

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col max-h-[75vh] min-h-[600px]">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-muted-foreground">
                    <thead className="bg-muted border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <tr>
                            <ProjectFilterHeader
                                activities={activities}
                                lookups={lookups}
                                filters={filters}
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                handleFilterChange={handleFilterChange}
                                handleBulkFilterChange={handleBulkFilterChange}
                                filterRef={filterRef}
                                forceAbove={forceAbove}
                            />
                            <th className="px-4 py-3 align-middle w-[8%] sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border">
                                {(fieldConfigs?.acv as { fieldName?: string })?.fieldName === 'THOUSANDS' ? 'ACV (K)' :
                                    (fieldConfigs?.acv as { fieldName?: string })?.fieldName === 'MILLIONS' ? 'ACV (M)' :
                                        (fieldConfigs?.acv as { fieldName?: string })?.fieldName === 'BILLIONS' ? 'ACV (B)' : 'ACV'}
                            </th>
                            <th className="px-4 py-3 align-middle w-[14%] sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border">Due Date</th>

                            <RenderFilterHeader
                                label="Version"
                                field="versionId"
                                width="w-[10%]"
                                options={versionOptions}
                                filters={filters}
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                handleFilterChange={handleFilterChange}
                                filterRef={filterRef}
                                forceAbove={forceAbove}
                                linkedFilter={{
                                    field: 'categoryId',
                                    label: 'Category',
                                    options: categoryOptions
                                }}
                            />

                            <LocationFilterHeader
                                lookups={lookups}
                                filters={filters}
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                handleFilterChange={handleFilterChange}
                                handleBulkFilterChange={handleBulkFilterChange}
                                filterRef={filterRef}
                                forceAbove={forceAbove}
                            />

                            <RenderFilterHeader
                                label="Status"
                                field="statusId"
                                width="w-[10%]"
                                options={statusOptions}
                                filters={filters}
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                handleFilterChange={handleFilterChange}
                                filterRef={filterRef}
                                forceAbove={forceAbove}
                            />

                            <DealTeamFilterHeader
                                activities={activities}
                                filters={filters}
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                handleFilterChange={handleFilterChange}
                                handleBulkFilterChange={handleBulkFilterChange}
                                filterRef={filterRef}
                                forceAbove={forceAbove}
                            />

                            <th className="px-4 py-3 align-middle w-[8%] sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm border-b border-border">Edit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {groupKeys.length === 0 ? (
                            <tr><td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">No activities found.</td></tr>
                        ) : (
                            groupKeys.map(keyName => {
                                const isExpanded = expandedGroups[keyName] !== false;
                                return (
                                    <Fragment key={keyName}>
                                        <tr
                                            onClick={() => toggleGroup(keyName)}
                                            key={`group-${keyName}`}
                                            className="bg-muted/30 hover:bg-muted/50 cursor-pointer transition select-none border-b border-border"
                                        >
                                            <td colSpan={9} className="px-4 py-2 font-bold text-foreground text-xs flex items-center gap-2">
                                                <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                                                {keyName}
                                                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{groupedActivities[keyName].length}</span>
                                            </td>
                                        </tr>
                                        {isExpanded && groupedActivities[keyName].map((act) => (
                                            <ActivityRow
                                                key={act.id}
                                                activity={act}
                                                groupBy={groupBy}
                                                lookups={lookups}
                                                getDateColor={getDateColor}
                                                getFirstName={getFirstName}
                                                handleInlineUpdate={handleInlineUpdate}
                                                handleEdit={handleEdit}
                                                handleStorageOpen={handleStorageOpen}
                                                handleCommentsOpen={handleCommentsOpen}
                                                handleFilterChange={handleFilterChange}
                                                isReadOnly={isReadOnly}
                                            />
                                        ))}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

