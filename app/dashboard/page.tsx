import { getSession } from '@/lib/actions/auth'
import { TEAM_ORDER } from '@/lib/constants'
import { getActivities, getUniqueClients, getActivityStats, getActivityFacets } from '@/lib/actions/activity'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import { getFieldConfigs } from '@/lib/actions/field-config'
import DashboardClient from '@/components/dashboard-client'

interface DashboardPageProps {
    searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function DashboardPage(props: DashboardPageProps) {
    const searchParams = await props.searchParams
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    // Extract filters from searchParams
    const page = parseInt(searchParams.page || '1')
    const limit = parseInt(searchParams.limit || '15')
    const search = searchParams.search || ''
    const viewMode = (searchParams.viewMode as 'pipeline' | 'closed' | 'inactive') || 'pipeline'

    // Separate UI state (search, viewMode, page) from Attribute Filters
    const { page: _p, limit: _l, search: _s, viewMode: _v, ...filters } = searchParams

    // Fetch Lookups
    const [users, verticals, horizontals, locations, statuses, versions, categories, outcomes, teams, fieldConfigs, currentUserData, acvStats, facetsResult] = await Promise.all([
        prisma.user.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: { teams: true, manager: true }
        }),
        prisma.vertical.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.horizontal.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.location.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.status.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        }),
        prisma.version.findMany({ orderBy: { displayOrder: 'asc' } }),
        prisma.category.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.outcome.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
        prisma.team.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' }, include: { users: true } }),
        getFieldConfigs(),
        prisma.user.findUnique({ where: { id: session.id } }),
        getActivityStats({
            search,
            viewMode,
            filters: filters as Record<string, string>
        }),
        getActivityFacets({
            search,
            viewMode,
            filters: filters as Record<string, string>
        })
    ])

    // Helper to apply user sort preference
    const applyUserSort = <T extends { id: number; displayOrder?: number }>(items: T[], category: string): T[] => {
        if (!currentUserData?.preferenceSortOrder) return items;
        try {
            const orderMap = JSON.parse(currentUserData.preferenceSortOrder) as Record<string, unknown>;
            const orderIds = orderMap[category];
            if (!Array.isArray(orderIds)) return items;

            // Create a map for quick priority lookup
            const priorityMap = new Map(orderIds.map((id, index) => [id, index]));

            return [...items].sort((a, b) => {
                const pA = priorityMap.has(a.id) ? priorityMap.get(a.id)! : 9999;
                const pB = priorityMap.has(b.id) ? priorityMap.get(b.id)! : 9999;
                return pA - pB;
            });
        } catch (e) {
            console.error('Failed to parse preferenceSortOrder', e);
            return items;
        }
    }

    // Apply Overrides
    const sortedVerticals = applyUserSort(verticals, 'vertical');
    const sortedHorizontals = applyUserSort(horizontals, 'horizontal');
    const sortedLocations = applyUserSort(locations, 'location');
    const sortedTeams = applyUserSort(teams, 'team'); // Also allow team re-order if needed

    // Fetch Activities
    const result = await getActivities({
        page,
        limit,
        search,
        viewMode,
        filters: filters as Record<string, string>
    })

    const activities = result.success && result.data ? result.data : []
    const metadata = result.success && result.metadata ? result.metadata : { totalCount: 0, totalPages: 0, currentPage: 1, limit: 15 }

    // Fetch Stats Data (Removed)

    return (
        <div className="h-full overflow-hidden">
            <DashboardClient
                session={{
                    ...session,
                    ...currentUserData, // Merge latest DB data including prefs
                    avatar: currentUserData?.avatar || session.avatar
                }}
                initialActivities={activities}
                lookups={{
                    statuses,
                    categories,
                    versions,
                    locations: sortedLocations,
                    verticals: sortedVerticals,
                    horizontals: sortedHorizontals,
                    outcomes,
                    users,
                    teams: sortedTeams
                }}
                acvRange={acvStats.success ? acvStats.data : { minAcv: 0, maxAcv: 0, minDate: null, maxDate: null }}
                facets={facetsResult.data}
                pagination={metadata}
                config={{
                    global: fieldConfigs.success && fieldConfigs.data ? fieldConfigs.data : [],
                    user: {
                        currency: currentUserData?.preferenceCurrency,
                        dateFormat: currentUserData?.preferenceDateFormat,
                        acvUnit: currentUserData?.preferenceAcvUnit,
                        acvDecimals: currentUserData?.preferenceAcvDecimals
                    }
                }}
            />
        </div>
    )
}
