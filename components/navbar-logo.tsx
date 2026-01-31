'use client'

import React from 'react'
import Link from 'next/link'

export function NavbarLogo() {
    return (
        <Link href="/dashboard" className="relative flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#f5f5f5] dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 shadow-sm transition-transform duration-500 ease-in-out group-hover:scale-[2] overflow-hidden p-0.5">
                <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div className="relative inline-block overflow-hidden h-6 flex items-center">
                <div className="flex flex-col transition-transform duration-400 ease-out transform group-hover:-translate-y-1/2">
                    <span className="text-base font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-pink-500 bg-clip-text text-transparent animate-gradient opacity-90">
                        PricingTracker
                    </span>
                    <span className="text-base font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                        PricingTracker
                    </span>
                </div>
            </div>
        </Link>
    )
}
