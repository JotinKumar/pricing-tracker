'use client'

import { Filter as FilterIcon } from 'lucide-react'

interface FilterTriggerProps {
    label: string
    isActive: boolean
    hasValue: boolean | string | undefined
}

export function FilterTrigger({ label, isActive, hasValue }: FilterTriggerProps) {
    return (
        <div className={`flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 rounded px-1 active:bg-muted ${isActive ? 'bg-muted/50' : ''}`}>
            <span>{label}</span>
            <button
                className={`transition-colors ${isActive || hasValue ? 'text-primary' : 'text-muted-foreground/50 hover:text-foreground'}`}
            >
                <FilterIcon className="h-3 w-3" fill={hasValue ? "currentColor" : "none"} />
            </button>
        </div>
    )
}
