import { redirect } from 'next/navigation'
import { getSession } from '@/lib/actions/auth'

import { getFieldConfigs } from '@/lib/actions/field-config'
import AdminPanel from '@/components/admin-panel'
import { FieldConfig } from '@/types'

export default async function AdminPage() {
    const session = await getSession()

    if (!session || session.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    // Server-side hydration data fetching
    const fiscalRes = await getFieldConfigs()

    const fiscalConfig = fiscalRes.success && fiscalRes.data
        ? fiscalRes.data.find((c: FieldConfig) => c.targetField === 'fiscal')
        : undefined

    return <div className="h-full overflow-hidden"><AdminPanel
        session={session}
        initialFiscalConfig={fiscalConfig ?? undefined}
    /></div>
}
