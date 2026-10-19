
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { submitActivity } from '@/lib/actions/activity'
import { toast } from "sonner"

import { DashboardControls } from './dashboard/dashboard-controls'
import { ActivityTable } from './dashboard/activity-table'
import { useActivityGrouping } from '@/hooks/use-activity-grouping'
import { LookupItem, Lookups, PricingActivity, UserSession, FieldConfig, DashboardFacets } from '@/types'
import { getDateColor, getFirstName } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { StorageModal } from './dashboard/storage-modal'
import { CommentsModal } from './dashboard/comments-modal'

interface DashboardClientProps {
  session: UserSession
  initialActivities: PricingActivity[]
  lookups: Lookups
  pagination: {
    totalCount: number
    totalPages: number
    currentPage: number
    limit: number
  }
  acvRange: {
    minAcv: number
    maxAcv: number
    minDate: Date | null
    maxDate: Date | null
  }
  facets: DashboardFacets
  config: {
    global: FieldConfig[]
    user: {
      currency?: string | null
      dateFormat?: string | null
      acvUnit?: string | null
      acvDecimals?: string | null
    }
  }
}

export default function DashboardClient({ session, initialActivities, lookups, pagination, config, acvRange, facets }: DashboardClientProps) {
  const isReadOnly = session.role === 'READ_ONLY';
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activities, setActivities] = useState<PricingActivity[]>(initialActivities)
  const [showAutoAdded, setShowAutoAdded] = useState(false)

  const [selectedActivity, setSelectedActivity] = useState<PricingActivity | null>(null)
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false)

  // Sync activities when initialActivities change (filter/page change on the server)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync server-rendered prop into local state on prop change
    setActivities(initialActivities)
  }, [initialActivities])

  // URL State management
  const search = searchParams.get('search') || ''
  const viewMode = (searchParams.get('viewMode') as 'pipeline' | 'closed' | 'inactive') || 'pipeline'
  const activeFilter = searchParams.get('activeFilter')
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null)

  // Extract filters for the Table component
  const filters: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (['page', 'limit', 'search', 'viewMode'].includes(key)) return
    filters[key] = value
  })

  // URL Updaters
  const updateUrl = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    // Always reset to page 1 on filter change
    if (params.has('page')) params.delete('page')

    router.push(`?${params.toString()}`)
  }

  const setSearch = (val: string) => updateUrl({ search: val })
  const setViewMode = (val: 'pipeline' | 'closed' | 'inactive') => updateUrl({ viewMode: val })

  const handleFilterChange = (field: string, value: string) => {
    updateUrl({ [field]: value })
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || !!search

  const clearAllFilters = () => {
    const cleared: Record<string, string | null> = {}
    Object.keys(filters).forEach((key) => { cleared[key] = null })
    cleared.search = null
    updateUrl(cleared)
  }

  // Size the page to the viewport: the table reports how many rows fit and we
  // set that as the server-side limit so the table never needs to scroll.
  const setPageSize = useCallback((rows: number) => {
    if (rows < 1 || rows === pagination.limit) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('limit', String(rows))
    params.delete('page')
    router.replace(`?${params.toString()}`)
  }, [pagination.limit, searchParams, router])


  const {
    groupBy, setGroupBy,
    expandedGroups, toggleGroup,
    groupedActivities,
    groupKeys
  } = useActivityGrouping(activities)


  // eslint-disable-next-line react-hooks/set-state-in-effect -- async event handler; setState runs after await, not in an effect
  const handleInlineUpdate = async (activity: PricingActivity, field: string, value: string) => {
    const intValue = parseInt(value)

    // Optimistic Update
    const updatedActivities = activities.map(a =>
      a.id === activity.id ? {
        ...a,
        [field === 'statusId' ? 'status' : 'version']: {
          ...((field === 'statusId' ? lookups.statuses : lookups.versions).find((i: LookupItem) => i.id === intValue) || { id: intValue })
        }
      } : a
    )
    setActivities(updatedActivities)

    const flatPayload = {
      id: activity.id,
      id1: activity.id1 || '',
      id2: activity.id2 || '',
      clientName: activity.clientName,
      projectName: activity.projectName,
      verticalId: String(activity.verticalId),
      horizontalId: String(activity.horizontalId),
      annualContractValue: activity.annualContractValue,
      dueDate: activity.dueDate, // Date object
      clientLocationIds: activity.clientLocations?.map((l) => l.id) || [],
      deliveryLocationIds: activity.deliveryLocations?.map((l) => l.id) || [],
      teamMembers: activity.teamMembers?.map((tm) => ({
        teamId: tm.teamId,
        userId: tm.userId
      })) ?? [],
      assignDate: activity.assignDate, // Date object
      statusId: String(activity.statusId),
      categoryId: String(activity.categoryId),
      versionId: String(activity.versionId),
      outcomeId: activity.outcomeId ? String(activity.outcomeId) : undefined,
      newComment: '',
      [field]: String(intValue) // Override the changed field with string
    }

    const result = await submitActivity(flatPayload)
    if (!result.success) {
      console.error("Failed to update", result.message)
      toast.error(`Failed to update: ${result.message}`)
      // Revert on failure could be added here
      setActivities(initialActivities) // simplistic revert
    } else {
      toast.success("Status updated successfully")
      // Optional: Router refresh to re-fetch data to ensure consistency?
      // router.refresh() 
    }
  }

  const handleEdit = (activity: PricingActivity) => {
    router.push(`/dashboard/activity/${activity.id}`)
  }

  const handleStorageOpen = (activity: PricingActivity) => {
    setSelectedActivity(activity)
    setIsStorageModalOpen(true)
  }

  const handleCreate = () => {
    router.push('/dashboard/activity/new')
  }

  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)

  const handleCommentsOpen = (activity: PricingActivity) => {
    setSelectedActivity(activity)
    setIsCommentsModalOpen(true)
  }

  // ... (rest of the functions)

  const filterRef = useRef(null)

  return (
    <div className="h-full overflow-hidden font-sans text-foreground transition-colors duration-300">
      <main className="mx-auto flex h-full max-w-7xl flex-col gap-2 overflow-hidden px-6 pt-2 pb-3">
        <DashboardControls
          search={search}
          setSearch={setSearch}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isReadOnly={isReadOnly}
          handleCreate={handleCreate}
          hasActiveFilters={hasActiveFilters}
          clearAllFilters={clearAllFilters}
          showAutoAdded={showAutoAdded}
          setShowAutoAdded={setShowAutoAdded}
        />

        <ActivityTable
          groupedActivities={groupedActivities}
          groupKeys={groupKeys}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          lookups={lookups}
          filters={filters}
          activeFilter={activeFilterDropdown}
          setActiveFilter={setActiveFilterDropdown}
          handleFilterChange={handleFilterChange}
          handleBulkFilterChange={updateUrl}
          filterRef={filterRef}
          groupBy={groupBy}
          getDateColor={getDateColor}
          getFirstName={getFirstName}
          handleInlineUpdate={handleInlineUpdate}
          handleEdit={handleEdit}
          handleStorageOpen={handleStorageOpen}
          handleCommentsOpen={handleCommentsOpen}
          isReadOnly={isReadOnly}
          config={config}
          acvRange={acvRange}
          facets={facets}
          pagination={pagination}
          onCapacityChange={setPageSize}
          showAutoAdded={showAutoAdded}
        />
      </main>

      {
        isStorageModalOpen && selectedActivity && (
          <StorageModal
            isOpen={isStorageModalOpen}
            onClose={() => setIsStorageModalOpen(false)}
            activity={selectedActivity}
            currentUserId={session.id}
            currentUserRole={session.role}
          />
        )
      }

      {
        isCommentsModalOpen && selectedActivity && (
          <CommentsModal
            isOpen={isCommentsModalOpen}
            onClose={() => setIsCommentsModalOpen(false)}
            activity={selectedActivity}
            currentUserId={session.id}
            currentUserRole={session.role}
          />
        )
      }
    </div >
  )
}

