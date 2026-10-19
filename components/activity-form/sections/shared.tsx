import { SelectItem } from '@/components/ui/select'
import { Lookups, UserSession } from '@/types'

export interface SectionProps {
    lookups: Lookups
    session: UserSession
    lockedUserIds?: number[]
    clientNames?: string[]
    ownerId?: number
    autoManagerIds?: number[]
    onAutoManagerIdsChange?: (ids: number[]) => void
}

// Helper for Dropdowns - using Radix SelectItem
// This function accepts various lookup types and extracts their display values
type SelectLookupItem = { id: number;[key: string]: unknown }

export const renderOptions = (items: SelectLookupItem[]) => items?.map(i => (
    <SelectItem key={i.id} value={String(i.id)}>
        {String(i.vertical || i.horizontal || i.category || i.status || i.outcome || i.version || i.teamname || i.name || i.country || i.display || '')}
    </SelectItem>
))
