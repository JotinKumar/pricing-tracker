import { getSession } from '@/lib/actions/auth'
import { TEAM_ORDER } from '@/lib/constants'
import { getActivities, getUniqueClients, getActivityStats } from '@/lib/actions/activity'
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
    const [users, verticals, horizontals, locations, statuses, versions, categories, outcomes, teams, fieldConfigs, currentUserData, acvStats] = await Promise.all([
        prisma.user.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: { teams: true, manager: true }
        }),
        prisma.vertical.findMany({ where: { isActive: true }, orderBy: { vertical: 'asc' } }),
        prisma.horizontal.findMany({ where: { isActive: true }, orderBy: { horizontal: 'asc' } }),
        prisma.location.findMany({ where: { isActive: true }, orderBy: { country: 'asc' } }),
        prisma.status.findMany({
            where: { isActive: true },
            orderBy: { id: 'asc' }
        }),
        prisma.version.findMany({ orderBy: { id: 'asc' } }),
        prisma.category.findMany({ where: { isActive: true }, orderBy: { category: 'asc' } }),
        prisma.outcome.findMany({ where: { isActive: true }, orderBy: { outcome: 'asc' } }),
        prisma.team.findMany({ where: { isActive: true }, include: { users: true } }),
        getFieldConfigs(),
        prisma.user.findUnique({ where: { id: session.id } }),
        getActivityStats()
    ])

    // Custom Sort for Teams
    teams.sort((a, b) => {
        const indexA = TEAM_ORDER.indexOf(a.teamname);
        const indexB = TEAM_ORDER.indexOf(b.teamname);

        if (indexA === -1 && indexB === -1) return a.teamname.localeCompare(b.teamname);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
    })

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
        <div className="min-h-screen">
            <DashboardClient
                session={{
                    ...session,
                    ...currentUserData, // Merge latest DB data including prefs
                    image: currentUserData?.avatar || session.image
                }}
                initialActivities={activities}
                lookups={{
                    statuses,
                    categories,
                    versions,
                    locations,
                    verticals,
                    horizontals,
                    outcomes,
                    users,
                    teams
                }}
                acvRange={acvStats.success ? acvStats.data : { minAcv: 0, maxAcv: 0 }}
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
