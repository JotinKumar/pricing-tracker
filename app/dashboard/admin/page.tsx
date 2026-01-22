import { redirect } from 'next/navigation'
import { getSession } from '@/lib/actions/auth'
import AdminPanel from '@/components/admin-panel'

export default async function AdminPage() {
    const session = await getSession()

    if (!session || session.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    return <AdminPanel session={session} />
}
