import { PricingActivity, Lookups } from '@/types'

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
}

export interface DealTeamFilterHeaderProps extends CommonHeaderProps {
    activities: PricingActivity[]
}

export interface ProjectFilterHeaderProps extends CommonHeaderProps {
    activities: PricingActivity[]
    lookups: Lookups
}
