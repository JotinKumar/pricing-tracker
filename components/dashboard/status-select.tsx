'use client'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { getStatusStyle } from '@/lib/constants'
import { Status } from '@/types'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface StatusSelectProps {
    currentStatusId: number | undefined
    currentStatusName: string | undefined | null
    options: Status[]
    onUpdate: (value: string) => Promise<void>
}

export function StatusSelect({ currentStatusId, currentStatusName, options, onUpdate }: StatusSelectProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleValueChange = async (newValue: string) => {
        const previousValue = currentStatusId?.toString();

        if (newValue === previousValue) return;

        setIsLoading(true);
        setIsSuccess(false);

        try {
            await onUpdate(newValue);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2000); // Reset success state after 2s
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative inline-block">
            <Select
                value={currentStatusId?.toString() || ''}
                onValueChange={handleValueChange}
                disabled={isLoading}
            >
                <SelectTrigger
                    className={cn(
                        "h-6 min-h-[24px] w-[125px] gap-2 rounded-full border-none px-3 py-0 text-xs font-bold uppercase shadow-sm ring-1 ring-inset ring-black/5 transition-all focus:ring-2 focus:ring-ring dark:ring-white/10 [&>svg]:opacity-50",
                        getStatusStyle(currentStatusName),
                        isLoading && "opacity-70 cursor-wait",
                    )}
                >
                    <SelectValue placeholder="Status">
                        {options.find(o => o.id.toString() === currentStatusId?.toString())?.display || currentStatusName || "Status"}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {options.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()} className="text-xs font-medium">
                            {s.display || s.status}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Loading/Success Indicator - Positioned to not overlap text, reusing similar logic but careful with SelectTrigger layout */}
            {(isLoading || isSuccess) && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-current opacity-70" />
                    ) : isSuccess ? (
                        <Check className="h-3 w-3 text-current opacity-100 transition-opacity duration-300" />
                    ) : null}
                </div>
            )}
        </div>
    )
}
