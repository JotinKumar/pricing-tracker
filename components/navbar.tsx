'use client'

import { LogOut } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { logout } from '@/lib/actions/auth'
import Link from 'next/link'

interface NavbarProps {
    session: any
}

export function Navbar({ session }: NavbarProps) {
    const handleLogout = async () => {
        await logout()
    }

    return (
        <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl px-6 py-3 transition-all supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                    <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-[#0D47A1] to-[#E91E63] bg-clip-text text-transparent">
                            PricingTracker
                        </span>
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    {session.role === 'ADMIN' && (
                        <Link href="/dashboard/admin" className="text-xs font-bold text-primary hover:text-primary/80 transition">
                            Admin Panel
                        </Link>
                    )}

                    <div className="flex items-center gap-3 pl-4 border-l border-border">
                        <ModeToggle />

                        <Avatar className="h-8 w-8 border-2 border-background shadow-sm ring-1 ring-border cursor-pointer transition hover:ring-primary">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${session.name}`} alt={session.name} />
                            <AvatarFallback>{session.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>

                        <button
                            onClick={handleLogout}
                            className="ml-2 rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
