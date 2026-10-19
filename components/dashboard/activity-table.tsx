'use client'

import { Fragment, useMemo, useEffect, useRef, useCallback } from 'react'
import { RenderFilterHeader, LocationFilterHeader, DealTeamFilterHeader, ProjectFilterHeader } from './filter-headers'
import { DueDateFilterHeader } from './filter-headers/due-date-filter-header'
import { PricingActivity, Lookups, FieldConfig, DashboardFacets } from '@/types'
import { ActivityRow } from './activity-row'
import { AcvFilterHeader } from './acv-filter-header'
import { PaginationControls } from './pagination-controls'

const ROW_HEIGHT_PX = 54
const THEAD_HEIGHT_PX = 44
const PAGINATION_HEIGHT_PX = 56
const BUFFER_ROWS = 2
const MIN_ROWS = 5

interface ActivityTableProps {
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
    config?: {
        global: FieldConfig[]
        user: {
            currency?: string | null
            dateFormat?: string | null
            acvUnit?: string | null
            acvDecimals?: string | null
        }
    }
    acvRange: {
        minAcv: number
        maxAcv: number
        minDate: Date | null
        maxDate: Date | null
    }
    facets: DashboardFacets
    pagination: {
        totalCount: number
        totalPages: number
        currentPage: number
        limit: number
    }
    onCapacityChange: (rows: number) => void
    showAutoAdded?: boolean
}

export function ActivityTable({
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
    config,
    acvRange,
    facets,
    pagination,
    onCapacityChange,
    showAutoAdded = false
}: ActivityTableProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const lastReported = useRef<number>(0)

    // Memoize expensive calculations
    const totalVisibleRows = useMemo(() =>
        Object.values(groupedActivities).reduce((acc, curr) => acc + curr.length, 0),
        [groupedActivities]
    )
    const forceAbove = totalVisibleRows < 3

    // Measure available height and report how many rows fit
    const measureCapacity = useCallback(() => {
        const el = containerRef.current
        if (!el) return
        const available = el.clientHeight - THEAD_HEIGHT_PX - PAGINATION_HEIGHT_PX
        if (available <= 0) return
        const rows = Math.max(MIN_ROWS, Math.floor(available / ROW_HEIGHT_PX) - BUFFER_ROWS)
        if (rows !== lastReported.current) {
            lastReported.current = rows
            onCapacityChange(rows)
        }
    }, [onCapacityChange])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        measureCapacity()
        const ro = new ResizeObserver(() => measureCapacity())
        ro.observe(el)
        return () => ro.disconnect()
    }, [measureCapacity])

    // Keep only options available under the current facets, always retaining
    // the currently-selected value so the user can still clear it.
    const filterByFacet = <T extends { value: string }>(opts: T[], availableIds: number[], selected?: string): T[] => {
        const available = new Set(availableIds.map(String))
        return opts.filter(o => available.has(o.value) || o.value === selected)
    }

    // Memoize options arrays to prevent unnecessary re-renders
    const versionOptions = useMemo(() =>
        filterByFacet(
            lookups.versions.map((v) => ({
                label: v.version,
                value: v.id.toString(),
                className: "bg-popover text-popover-foreground"
            })),
            facets.versionIds,
            filters['versionId']
        ),
        [lookups.versions, facets.versionIds, filters]
    )

    const categoryOptions = useMemo(() =>
        filterByFacet(
            lookups.categories.map((c) => ({
                label: c.category,
                value: c.id.toString()
            })),
            facets.categoryIds,
            filters['categoryId']
        ),
        [lookups.categories, facets.categoryIds, filters]
    )

    const statusOptions = useMemo(() =>
        filterByFacet(
            lookups.statuses.map((s) => ({
                label: s.status,
                value: s.id.toString(),
                className: "bg-popover text-popover-foreground"
            })),
            facets.statusIds,
            filters['statusId']
        ),
        [lookups.statuses, facets.statusIds, filters]
    )

    return (
        <div ref={containerRef} className="flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs text-muted-foreground relative table-fixed">
                    <thead className="bg-muted border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground sticky top-0 z-30 shadow-sm">
                        <tr>
                            <ProjectFilterHeader
                                lookups={lookups}
                                facets={facets}
                                filters={filters}
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                handleFilterChange={handleFilterChange}
                                handleBulkFilterChange={handleBulkFilterChange}
                                filterRef={filterRef}
                                forceAbove={forceAbove}
                                config={config}
                            />
                            <th className="px-4 py-3 align-middle w-[10%] bg-muted/95 backdrop-blur-sm border-b border-border">
                                <AcvFilterHeader
                                    min={acvRange?.minAcv || 0}
                                    max={acvRange?.maxAcv || 10000000}
                                    filters={filters}
                                    handleFilterChange={handleFilterChange}
                                    handleBulkFilterChange={handleBulkFilterChange}
                                    config={config}
                                />
                            </th>
                            <th className="px-4 py-3 align-middle w-[12%] bg-muted/95 backdrop-blur-sm border-b border-border">
                                <DueDateFilterHeader
                                    filters={filters}
                                    handleBulkFilterChange={handleBulkFilterChange}
                                    minDate={acvRange?.minDate}
                                    maxDate={acvRange?.maxDate}
                                />
                            </th>

                            <RenderFilterHeader
                                label="Version"
                                field="versionId"
                                width="w-[10%]"
                                options={versionOptions}
                                filters={filters}
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                handleFilterChange={handleFilterChange}
                                handleBulkFilterChange={handleBulkFilterChange}
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
                                facets={facets}
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
                                width="w-[12%]"
                                options={statusOptions}
                                filters={filters}
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                handleFilterChange={handleFilterChange}
                                handleBulkFilterChange={handleBulkFilterChange}
                                filterRef={filterRef}
                                forceAbove={forceAbove}
                            />

                            <DealTeamFilterHeader
                                facets={facets}
                                filters={filters}
                                activeFilter={activeFilter}
                                setActiveFilter={setActiveFilter}
                                handleFilterChange={handleFilterChange}
                                handleBulkFilterChange={handleBulkFilterChange}
                                filterRef={filterRef}
                                forceAbove={forceAbove}
                            />

                            <th className="px-4 py-3 align-middle w-[10%] bg-muted/95 backdrop-blur-sm border-b border-border text-center">Edit</th>
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
                                                config={config}
                                                showAutoAdded={showAutoAdded}
                                            />
                                        ))}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            <PaginationControls totalPages={pagination.totalPages} currentPage={pagination.currentPage} />
        </div>
    )
}
