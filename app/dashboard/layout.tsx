import { getSession } from '@/lib/actions/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'

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
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            <div className="relative z-10 flex flex-col flex-1 min-h-0">
                <Navbar session={user} />
                <main className="flex-1 min-h-0 pt-20 overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
