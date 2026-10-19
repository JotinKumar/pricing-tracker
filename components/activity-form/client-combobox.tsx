'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface ClientComboboxProps {
    value: string
    onChange: (value: string) => void
    options: string[]
    placeholder?: string
    disabled?: boolean
}

export function ClientCombobox({ value, onChange, options = [], placeholder = "Select client...", disabled }: ClientComboboxProps) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync input value if external value changes (e.g. form reset), but only if not focused to avoid typing interference
    useEffect(() => {
        if (value !== inputValue) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sync external prop to local state; guarded by inequality to avoid a render loop
            setInputValue(value)
        }
    }, [value])

    // Close dropdown when clicking outside the combobox
    useEffect(() => {
        if (!open) return
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value
        setInputValue(newVal)
        onChange(newVal) // Update form immediately
        setOpen(true) // Open dropdown when typing
    }

    const handleSelect = (currentValue: string) => {
        setInputValue(currentValue)
        onChange(currentValue)
        setOpen(false)
    }

    // Filter options based on input
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(inputValue.toLowerCase())
    )

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full pr-10"
                    autoComplete="off"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => {
                        if (disabled) return
                        setOpen(!open)
                        if (!open) {
                            inputRef.current?.focus()
                        }
                    }}
                    tabIndex={-1}
                >
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </div>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                    <div className="max-h-[200px] overflow-y-auto p-1">
                        {filteredOptions.length === 0 && inputValue.trim() !== "" && (
                            <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                                New client &quot;{inputValue}&quot; will be created.
                            </div>
                        )}
                        {filteredOptions.length === 0 && inputValue.trim() === "" && options.length === 0 && (
                            <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                                No clients found.
                            </div>
                        )}
                        {filteredOptions.map((option) => (
                            <div
                                key={option}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                    value === option ? "bg-accent" : ""
                                )}
                                onClick={() => handleSelect(option)}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === option ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {option}
                            </div>
                        ))}
                        {/* Show valid options if input is empty */}
                        {inputValue.trim() === "" && options.map((option) => (
                            <div
                                key={option}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                    value === option ? "bg-accent" : ""
                                )}
                                onClick={() => handleSelect(option)}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === option ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {option}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
