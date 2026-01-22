
'use client'

import { useState, useEffect } from 'react'
import { submitActivity } from '@/lib/actions/activity'
import dynamic from 'next/dynamic'
import { toast } from "sonner"

import { DashboardControls } from './dashboard/dashboard-controls'
import { ActivityTable } from './dashboard/activity-table'
import { useActivityGrouping } from '@/hooks/use-activity-grouping'
import { LookupItem, Lookups, PricingActivity, UserSession } from '@/types'
import { getDateColor, getFirstName } from '@/lib/utils'
import { PaginationControls } from './dashboard/pagination-controls'
import { useRouter, useSearchParams } from 'next/navigation'
import { StorageModal } from './dashboard/storage-modal'

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

}

export default function DashboardClient({ session, initialActivities, lookups, pagination }: DashboardClientProps) {
  const isReadOnly = session.role === 'READ_ONLY';
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activities, setActivities] = useState<PricingActivity[]>(initialActivities)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<PricingActivity | null>(null)
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false)

  const [isMounted, setIsMounted] = useState(false)

  // Sync activities when server prop changes (navigating pages/filters)
  useEffect(() => {
    setActivities(initialActivities)
  }, [initialActivities])

  // URL State management
  const search = searchParams.get('search') || ''
  const viewMode = (searchParams.get('viewMode') as 'pipeline' | 'closed' | 'inactive') || 'pipeline'
  const activeFilter = searchParams.get('activeFilter') // Optional: Keep track of which dropdown is open? Or just visual.
  // Actually, keeping 'activeFilter' in URL for open dropdown state is overkill and bad UX (back button closes dropdown?). 
  // Let's keep dropdown open state local, but filter values in URL.
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
    // Reset to page 1 on filter change usually? Yes, unless it's just a page change.
    if (!newParams.page) params.set('page', '1')

    router.push(`?${params.toString()}`)
  }

  const setSearch = (val: string) => updateUrl({ search: val })
  const setViewMode = (val: 'pipeline' | 'closed' | 'inactive') => updateUrl({ viewMode: val })

  const handleFilterChange = (field: string, value: string) => {
    updateUrl({ [field]: value })
  }

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
      verticalId: activity.verticalId,
      horizontalId: activity.horizontalId,
      annualContractValue: activity.annualContractValue,
      dueDate: activity.dueDate, // Date object
      clientLocationIds: activity.clientLocations?.map((l) => l.id) || [],
      deliveryLocationIds: activity.deliveryLocations?.map((l) => l.id) || [],
      assignDate: activity.assignDate, // Date object
      statusId: activity.statusId,
      categoryId: activity.categoryId,
      versionId: activity.versionId,
      outcomeId: activity.outcomeId,
      newComment: '',
      [field]: intValue // Override the changed field with number
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

  const handleSuccess = (newOrUpdatedActivity: PricingActivity) => {
    setIsModalOpen(false)
    router.refresh() // Reload data from server to reflect changes safely
  }

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
            filterRef={null} // Ref handling for click outside needs lifting or removal
            groupBy={groupBy}
            getDateColor={getDateColor}
            getFirstName={getFirstName}
            handleInlineUpdate={handleInlineUpdate}
            handleEdit={handleEdit}
            handleStorageOpen={handleStorageOpen}
            isReadOnly={isReadOnly}
          />

          <PaginationControls
            totalPages={pagination.totalPages}
            currentPage={pagination.currentPage}
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
          />
        )
      }
    </div >
  )
}
