'use client'

import React from 'react'
import Link from 'next/link'

interface AnimatedNavLinkProps {
    href: string
    children: React.ReactNode
}

export const AnimatedNavLink = ({ href, children }: AnimatedNavLinkProps) => {
    // Adjusted colors for sustainability in light/dark modes
    const defaultTextColor = 'text-muted-foreground'
    const hoverTextColor = 'text-foreground'
    const textSizeClass = 'text-sm font-medium'

    return (
        <Link href={href} className={`group relative inline-block overflow-hidden h-5 flex items-center ${textSizeClass}`}>
            <div className="flex flex-col transition-transform duration-400 ease-out transform group-hover:-translate-y-1/2">
                <span className={defaultTextColor}>{children}</span>
                <span className={hoverTextColor}>{children}</span>
            </div>
        </Link>
    )
}
