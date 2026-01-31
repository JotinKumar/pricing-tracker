'use client'

import React, { useState, useEffect, useRef } from 'react'
import { LogOut } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { UserPreferencesModal } from '@/components/user-preferences-modal'
import { logout } from '@/lib/actions/auth'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { NavbarLogo } from '@/components/navbar-logo'
import { AnimatedNavLink } from '@/components/animated-nav-link'

interface NavbarProps {
    session: any
}

export function Navbar({ session }: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
    const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full')
    const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleLogout = async () => {
        await logout()
    }

    const toggleMenu = () => {
        setIsOpen(!isOpen)
    }

    useEffect(() => {
        if (shapeTimeoutRef.current) {
            clearTimeout(shapeTimeoutRef.current)
        }

        if (isOpen) {
            setHeaderShapeClass('rounded-xl')
        } else {
            shapeTimeoutRef.current = setTimeout(() => {
                setHeaderShapeClass('rounded-full')
            }, 300)
        }

        return () => {
            if (shapeTimeoutRef.current) {
                clearTimeout(shapeTimeoutRef.current)
            }
        }
    }, [isOpen])

    // Define Links
    const navLinksData = [
        { label: 'Dashboard', href: '/dashboard' },
    ]

    if (session.role === 'ADMIN') {
        navLinksData.push({ label: 'Admin', href: '/dashboard/admin' })
    }

    return (
        <>
            <header className={cn(
                "fixed top-6 left-1/2 transform -translate-x-1/2 z-40",
                "flex flex-col items-center",
                "px-6 py-2 backdrop-blur-md",
                headerShapeClass,
                "border border-border/50 dark:border-white/10 bg-background/60 dark:bg-[#1a1a1a]/95 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 dark:supports-[backdrop-filter]:bg-[#1a1a1a]/80",
                "w-[calc(100%-2rem)] sm:w-auto min-w-[320px]",
                "transition-[border-radius] duration-300 ease-in-out"
            )}>

                <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
                    <div className="flex items-center">
                        <NavbarLogo />
                    </div>

                    <nav className="hidden sm:flex items-center space-x-6">
                        {navLinksData.map((link) => (
                            <AnimatedNavLink key={link.href} href={link.href}>
                                {link.label}
                            </AnimatedNavLink>
                        ))}
                    </nav>

                    <div className="hidden sm:flex items-center gap-3">
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

                    <button className="sm:hidden flex items-center justify-center w-8 h-8 text-muted-foreground focus:outline-none" onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
                        {isOpen ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        )}
                    </button>
                </div>

                <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                               ${isOpen ? 'max-h-[1000px] opacity-100 pt-4' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
                    <nav className="flex flex-col items-center space-y-4 text-base w-full mb-4">
                        {navLinksData.map((link) => (
                            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors w-full text-center py-1">
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="flex items-center justify-center gap-4 w-full border-t border-border pt-4">
                        <ModeToggle />
                        <div className="flex items-center gap-2" onClick={() => setIsPreferencesOpen(true)}>
                            <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage src={session.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${session.name}`} alt={session.name} />
                                <AvatarFallback>{session.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-red-500 hover:bg-destructive/10 rounded-full transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
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
