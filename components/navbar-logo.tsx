'use client'

import React from 'react'
import Link from 'next/link'

export function NavbarLogo() {
    return (
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-7 h-7 rounded-md border border-border bg-background overflow-hidden p-0.5 transition-colors group-hover:border-primary/40">
                <img src="/logo.png" alt="Pricing Tracker" className="h-full w-full object-contain" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                PricingTracker
            </span>
        </Link>
    )
}
