import { Lookups, FieldConfig, DashboardFacets } from '@/types'

export interface FilterProps {
    filters: Record<string, string>
    activeFilter: string | null
    setActiveFilter: (filter: string | null) => void
    handleFilterChange: (field: string, value: string) => void
    handleBulkFilterChange?: (changes: Record<string, string | null>) => void
    filterRef?: React.RefObject<HTMLDivElement | null>
    forceAbove?: boolean
}

export interface CommonHeaderProps extends FilterProps {
    width?: string
}

export interface RenderFilterHeaderProps extends CommonHeaderProps {
    label: string
    field: string
    options: { label: string; value: string; className?: string }[]
    width: string
    linkedFilter?: {
        field: string
        label: string
        options: { label: string; value: string }[]
    }
}

export interface LocationFilterHeaderProps extends CommonHeaderProps {
    lookups: Lookups
    facets: DashboardFacets
}

export interface DealTeamFilterHeaderProps extends CommonHeaderProps {
    facets: DashboardFacets
}

export interface ProjectFilterHeaderProps extends CommonHeaderProps {
    lookups: Lookups
    facets: DashboardFacets
    config?: {
        global: FieldConfig[]
        user: {
            currency?: string | null
            dateFormat?: string | null
            acvUnit?: string | null
            acvDecimals?: string | null
        }
    }
}
