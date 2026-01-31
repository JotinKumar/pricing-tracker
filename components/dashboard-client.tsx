
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { submitActivity, getActivities } from '@/lib/actions/activity'
import dynamic from 'next/dynamic'
import { toast } from "sonner"

import { DashboardControls } from './dashboard/dashboard-controls'
import { ActivityTable } from './dashboard/activity-table'
import { useActivityGrouping } from '@/hooks/use-activity-grouping'
import { LookupItem, Lookups, PricingActivity, UserSession } from '@/types'
import { getDateColor, getFirstName } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { StorageModal } from './dashboard/storage-modal'
import { CommentsModal } from './dashboard/comments-modal'

const ActivityForm = dynamic(() => import('@/components/activity-form'), { ssr: false })

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
  }
  config: {
    global: any[]
    user: {
      currency?: string | null
      dateFormat?: string | null
      acvUnit?: string | null
      acvDecimals?: string | null
    }
  }
}

export default function DashboardClient({ session, initialActivities, lookups, pagination, config, acvRange }: DashboardClientProps) {
  const isReadOnly = session.role === 'READ_ONLY';
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activities, setActivities] = useState<PricingActivity[]>(initialActivities)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(pagination.totalPages > 1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<PricingActivity | null>(null)
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false)

  const [isMounted, setIsMounted] = useState(false)

  // Sync activities when initialActivities change (due to top-level filter change)
  useEffect(() => {
    setActivities(initialActivities)
    setPage(1)
    setHasMore(pagination.totalPages > 1)
  }, [initialActivities, pagination.totalPages])

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

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    const nextPage = page + 1

    const result = await getActivities({
      page: nextPage,
      limit: pagination.limit, // Keep consistent limit
      search,
      viewMode,
      filters
    })

    if (result.success && result.data) {
      setActivities(prev => [...prev, ...result.data])
      setPage(nextPage)
      setHasMore(nextPage < result.metadata.totalPages)
    } else {
      setHasMore(false)
    }
    setIsLoadingMore(false)
  }, [page, hasMore, isLoadingMore, pagination.limit, search, viewMode, filters])


  const {
    groupBy, setGroupBy,
    expandedGroups, toggleGroup,
    groupedActivities,
    groupKeys
  } = useActivityGrouping(activities)


  useEffect(() => {
    setIsMounted(true)
  }, [])

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
      id1: (activity as any).id1 || (activity as any).salesForceId || '',
      id2: (activity as any).id2 || (activity as any).dsrNumber || '',
      clientName: activity.clientName,
      projectName: activity.projectName,
      verticalId: String(activity.verticalId),
      horizontalId: String(activity.horizontalId),
      annualContractValue: activity.annualContractValue,
      dueDate: activity.dueDate, // Date object
      clientLocationIds: activity.clientLocations?.map((l) => l.id) || [],
      deliveryLocationIds: activity.deliveryLocations?.map((l) => l.id) || [],
      teamMembers: (activity as any).teamMembers?.map((tm: any) => ({
        teamId: tm.teamId,
        userId: tm.userId
      })) || [],
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
    setSelectedActivity(activity)
    setIsModalOpen(true)
  }

  const handleStorageOpen = (activity: PricingActivity) => {
    setSelectedActivity(activity)
    setIsStorageModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedActivity(null)
    setIsModalOpen(true)
  }

  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)

  const handleCommentsOpen = (activity: PricingActivity) => {
    setSelectedActivity(activity)
    setIsCommentsModalOpen(true)
  }

  // ... (rest of the functions)

  const handleSuccess = (newOrUpdatedActivity: PricingActivity) => {
    setIsModalOpen(false)
    router.refresh() // Reload data from server to reflect changes safely
  }

  const filterRef = useRef(null)

  return (
    <div className="min-h-screen font-sans text-foreground transition-colors duration-300">
      <main className="mx-auto max-w-7xl p-6">
        <div className="flex flex-col gap-4">



          <DashboardControls
            search={search}
            setSearch={setSearch}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isReadOnly={isReadOnly}
            handleCreate={handleCreate}
          />

          <ActivityTable
            activities={activities} // For unique values filter gen (Note: this is only current page now)
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
            loadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />

        </div>
      </main>

      {
        isModalOpen && (
          <ActivityForm
            onClose={() => setIsModalOpen(false)}
            activity={selectedActivity}
            lookups={lookups}
            session={session}
            onSuccess={handleSuccess}
            isEdit={!!selectedActivity}
          />
        )
      }

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

