import { getSession } from '@/lib/actions/auth'
import { getActivityFormLookups, getActivityById } from '@/lib/actions/activity'
import { redirect, notFound } from 'next/navigation'
import { ActivityFormPage } from '@/components/activity-form/activity-form-page'

interface EditActivityPageProps {
    params: Promise<{ id: string }>
}

export default async function EditActivityPage({ params }: EditActivityPageProps) {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    if (isNaN(id)) {
        notFound()
    }

    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    const [activityResult, { lookups, user }] = await Promise.all([
        getActivityById(id),
        getActivityFormLookups(session.id)
    ])

    if (!activityResult.success || !activityResult.activity) {
        notFound()
    }

    return (
        <ActivityFormPage
            activity={activityResult.activity}
            lookups={lookups}
            session={{ ...session, ...user, avatar: user?.avatar || session.avatar }}
            isEdit={true}
        />
    )
}
