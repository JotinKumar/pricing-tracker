import { getSession } from '@/lib/actions/auth'
import { getActivityFormLookups } from '@/lib/actions/activity'
import { redirect } from 'next/navigation'
import { ActivityFormPage } from '@/components/activity-form/activity-form-page'

export default async function NewActivityPage() {
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    const { lookups, user } = await getActivityFormLookups(session.id)

    return (
        <ActivityFormPage
            activity={null}
            lookups={lookups}
            session={{ ...session, ...user, avatar: user?.avatar || session.avatar }}
            isEdit={false}
        />
    )
}
