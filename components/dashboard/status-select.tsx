'use client'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { getStatusStyle } from '@/lib/constants'
import { Status } from '@/types'

interface StatusSelectProps {
    currentStatusId: number | undefined
    currentStatusName: string | undefined | null
    options: Status[]
    onUpdate: (value: string) => Promise<void>
}

export function StatusSelect({ currentStatusId, currentStatusName, options, onUpdate }: StatusSelectProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
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
            // Optionally handle error state
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative inline-block">
            <select
                value={currentStatusId || ''}
                title={currentStatusName || 'Status'}
                disabled={isLoading}
                onChange={handleChange}
                className={`appearance-none rounded-full py-0.5 pl-2 pr-8 text-xs font-bold uppercase cursor-pointer shadow-sm ring-1 ring-inset ring-black/5 focus:ring-2 focus:ring-ring dark:ring-white/10 transition-all
                ${getStatusStyle(currentStatusName)} 
                ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
                {options.map((s) => (
                    <option key={s.id} value={s.id} title={s.status} className="bg-background text-foreground">
                        {s.display || s.status}
                    </option>
                ))}
            </select>

            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin text-current opacity-70" />
                ) : isSuccess ? (
                    <Check className="h-3 w-3 text-current opacity-100 transition-opacity duration-300" />
                ) : null}
            </div>
        </div>
    )
}
