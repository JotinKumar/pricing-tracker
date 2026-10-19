'use client'

import React, { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { ModeToggle } from '@/components/mode-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { UserPreferencesModal } from '@/components/user-preferences-modal'
import { logout } from '@/lib/actions/auth'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { NavbarLogo } from '@/components/navbar-logo'
import { UserSession } from '@/types'

interface NavbarProps {
    session: UserSession
}

export function Navbar({ session }: NavbarProps) {
    const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
    const pathname = usePathname()
    const isAdmin = pathname === '/dashboard/admin'

    const handleLogout = async () => {
        await logout()
    }

    return (
        <>
            <header className={cn(
                "fixed top-6 left-1/2 -translate-x-1/2 z-40",
                "flex items-center justify-between",
                "px-6 py-2",
                "rounded-xl",
                "w-[calc(100%-3rem)] max-w-[77rem]",
                "bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80",
                "border border-border shadow-sm",
            )}>
                {/* Left: Back arrow (admin only) + Logo */}
                <div className="flex items-center gap-2 flex-none">
                    {isAdmin && (
                        <Link
                            href="/dashboard"
                            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Back to Dashboard"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                    )}
                    <NavbarLogo />
                </div>

                {/* Center: Page Title with double underline */}
                <div className="flex-1 text-center px-4">
                    <span className="inline-block text-lg font-bold tracking-tight text-foreground border-b-[3px] border-double border-primary pb-0.5">
                        {isAdmin ? 'Admin Panel' : 'Deal Dashboard'}
                    </span>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-3 flex-none">
                    <ModeToggle />

                    <Popover>
                        <PopoverTrigger asChild>
                            <Avatar className="h-8 w-8 border border-border shadow-sm cursor-pointer transition hover:ring-2 hover:ring-primary/20">
                                <AvatarImage src={session.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${session.name}`} alt={session.name} />
                                <AvatarFallback>{session.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                            <div className="space-y-1">
                                <div className="px-2 py-1.5 text-sm font-semibold text-foreground">
                                    {session.name}
                                </div>
                                <div className="px-2 pb-2 text-xs text-muted-foreground border-b border-border/50 mb-2">
                                    {session.email}
                                </div>

                                {session.role === 'ADMIN' && !isAdmin && (
                                    <Link
                                        href="/dashboard/admin"
                                        className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                                    >
                                        Admin Panel
                                    </Link>
                                )}

                                <button
                                    onClick={() => setIsPreferencesOpen(true)}
                                    className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    Preferences
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-destructive/10 hover:text-destructive transition-colors text-red-500"
                                >
                                    Log out
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </header>

            <UserPreferencesModal
                isOpen={isPreferencesOpen}
                onClose={() => setIsPreferencesOpen(false)}
                session={session}
            />
        </>
    )
}
