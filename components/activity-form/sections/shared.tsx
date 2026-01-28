import { SelectItem } from '@/components/ui/select'
import { Lookups, UserSession } from '@/types'

export interface SectionProps {
    lookups: Lookups
    session: UserSession
    lockedUserIds?: number[]
    clientNames?: string[]
}

// Helper for Dropdowns - using Radix SelectItem
// This function accepts various lookup types and extracts their display values
type LookupItem = { id: number;[key: string]: any }

export const renderOptions = (items: LookupItem[]) => items?.map(i => (
    <SelectItem key={i.id} value={String(i.id)}>
        {i.vertical || i.horizontal || i.category || i.status || i.outcome || i.version || i.teamname || i.name || i.country || i.display}
    </SelectItem>
))
