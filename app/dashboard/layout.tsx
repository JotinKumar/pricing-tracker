import { getSession } from '@/lib/actions/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'

import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { cn } from '@/lib/utils'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.id }
    })

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-background flex flex-col relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <AnimatedGridPattern
                    numSquares={30}
                    maxOpacity={0.2}
                    duration={3}
                    repeatDelay={1}
                    className={cn(
                        "[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]",
                        "inset-y-0 h-full skew-y-0",
                        "hidden dark:block"
                    )}
                />
                {/* Light mode version or shared? The fill is gray-400/30. */}
                <AnimatedGridPattern
                    numSquares={30}
                    maxOpacity={0.1}
                    duration={3}
                    repeatDelay={1}
                    className={cn(
                        "[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]",
                        "inset-y-0 h-full skew-y-0",
                        "block dark:hidden"
                    )}
                />
            </div>

            <div className="relative z-10 flex flex-col flex-1">
                <Navbar session={user} />
                <main className="flex-1 pt-20 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
