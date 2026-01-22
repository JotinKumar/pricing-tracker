'use client'

import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    containerClassName?: string
}

export function SearchInput({ containerClassName, className, ...props }: SearchInputProps) {
    return (
        <div className={cn("relative", containerClassName)}>
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <Search className="w-4 h-4" />
            </div>
            <Input
                className={cn("pl-9 h-9 bg-muted/40 hover:bg-muted/60 focus:bg-background transition-colors", className)}
                type="search"
                placeholder="Search..."
                {...props}
            />
        </div>
    )
}
