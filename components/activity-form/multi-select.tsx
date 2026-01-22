'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

interface MultiSelectProps {
    options: any[]
    selectedIds: number[]
    onChange: (ids: number[]) => void
    placeholder: string
    disabled?: boolean
}

export function MultiSelect({ options, selectedIds, onChange, placeholder, disabled }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

    const toggleOption = (id: number) => {
        if (disabled) return
        const newSelected = selectedIds.includes(id)
            ? selectedIds.filter((x: number) => x !== id)
            : [...selectedIds, id]
        onChange(newSelected)
    }

    const selectedOptions = options.filter((o: any) => selectedIds.includes(o.id))

    return (
        <div className="relative" ref={containerRef}>
            <div
                className={`w-full min-h-[38px] rounded-lg border border-input bg-background px-3 py-2 text-sm cursor-pointer flex flex-wrap gap-1 items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-ring/50 focus-visible:ring-2 focus-visible:ring-ring'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {selectedOptions.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
                {selectedOptions.map((o: any) => (
                    <span key={o.id} className="bg-primary/15 text-primary text-xs px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                        {o.country} ({o.display})
                        {!disabled && (
                            <span
                                className="cursor-pointer hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                onClick={(e) => { e.stopPropagation(); toggleOption(o.id) }}
                            >
                                <X className="h-3 w-3" />
                            </span>
                        )}
                    </span>
                ))}
                {!disabled && (
                    <div className="ml-auto">
                        <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
                    </div>
                )}
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover shadow-lg">
                    {options.map((option: any) => {
                        const isSelected = selectedIds.includes(option.id)
                        return (
                            <div
                                key={option.id}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted flex items-center justify-between transition-colors ${isSelected ? 'bg-muted text-foreground font-medium' : 'text-popover-foreground'}`}
                                onClick={() => toggleOption(option.id)}
                            >
                                <span>{option.country} ({option.display})</span>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
