'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActivityAutoAssignment } from '@/hooks/use-activity-auto-assignment'
import { useActivityComments } from '@/hooks/use-activity-comments'
import { useActivitySubmit } from '@/hooks/use-activity-submit'
import {
    PrimaryDetails,
    LocationDetails,
    StakeholderDetails,
    FinancialDetails,
    DateDetails,
    StatusDetails
} from './sections'
import { Lookups, PricingActivity, UserSession } from '@/types'
import { activitySchema, ActivityFormValues } from '@/lib/schemas'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ActivityFormHeader } from './activity-form-header'
import { VersionConfirmModal } from './version-confirm-modal'
import { CommentsSection } from './comments-section'
import { FileStorageSection } from './file-storage-section'

interface ActivityFormProps {
    activity?: PricingActivity | null
    lookups: Lookups
    onClose: () => void
    onSuccess: (activity: PricingActivity) => void
    session: UserSession
    isEdit?: boolean
}

export default function ActivityForm({ 
    activity, 
    lookups, 
    onClose, 
    onSuccess, 
    session, 
    isEdit = false 
}: ActivityFormProps) {
    const [clientNames, setClientNames] = useState<string[]>([])
    const [initialVersionId, setInitialVersionId] = useState<string>('')

    // Fetch unique clients on mount
    useEffect(() => {
        import('@/lib/actions/activity').then(({ getUniqueClients }) => {
            getUniqueClients().then(res => {
                if (res.success && res.data) {
                    setClientNames(res.data)
                }
            })
        })
    }, [])

    // Track initial version for change detection
    useEffect(() => {
        if (isEdit && activity?.versionId) {
            setInitialVersionId(String(activity.versionId))
        }
    }, [isEdit, activity])

    const defaultValues: Partial<ActivityFormValues> = {
        id: activity?.id,
        id1: activity?.id1 || '',
        id2: activity?.id2 || '',
        clientName: activity?.clientName || '',
        projectName: activity?.projectName || '',
        verticalId: String(activity?.verticalId || lookups.verticals?.[0]?.id || ''),
        horizontalId: String(activity?.horizontalId || lookups.horizontals?.find((h) => h.horizontal === 'Regular')?.id || lookups.horizontals?.[0]?.id || ''),
        annualContractValue: activity?.annualContractValue || 0,
        dueDate: activity?.dueDate ? new Date(activity.dueDate) : new Date(Date.now() + 86400000),
        clientLocationIds: activity?.clientLocations?.map((l) => l.id) || [],
        deliveryLocationIds: activity?.deliveryLocations?.map((l) => l.id) || [],
        teamMembers: activity?.teamMembers?.map((tm) => ({
            teamId: tm.teamId,
            userId: tm.userId
        })) || [],
        assignDate: activity?.assignDate ? new Date(activity.assignDate) : new Date(),
        statusId: String(activity?.statusId || lookups.statuses?.[0]?.id || ''),
        categoryId: String(activity?.categoryId || lookups.categories?.[0]?.id || ''),
        versionId: String(activity?.versionId || lookups.versions?.[0]?.id || ''),
        outcomeId: String(activity?.outcomeId || lookups.outcomes?.find((o) => o.outcome === 'Pipeline')?.id || ''),
        newComment: '',
        isActive: true
    }

    const form = useForm<ActivityFormValues>({
        resolver: zodResolver(activitySchema) as any,
        defaultValues
    })

    // Auto-assignment logic
    const watchedVerticalId = form.watch('verticalId')
    const watchedHorizontalId = form.watch('horizontalId')
    const watchedClientLocationIds = form.watch('clientLocationIds')
    const watchedDeliveryLocationIds = form.watch('deliveryLocationIds')

    const { lockedUserIds } = useActivityAutoAssignment({
        form,
        verticalId: watchedVerticalId,
        horizontalId: watchedHorizontalId,
        clientLocationIds: watchedClientLocationIds,
        deliveryLocationIds: watchedDeliveryLocationIds
    })

    // Form submission logic
    const {
        loading,
        error,
        showVersionConfirm,
        pendingData,
        setShowVersionConfirm,
        setPendingData,
        handleSubmit,
        processSubmission
    } = useActivitySubmit({ isEdit, initialVersionId, onSuccess })

    // Comments management
    const {
        localComments,
        deleteCommentId,
        handleAddComment,
        handleDeleteComment,
        confirmDeleteComment,
        setDeleteCommentId
    } = useActivityComments({ activity })

    const onFormSubmit = form.handleSubmit(handleSubmit)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-background shadow-2xl">
                <Form {...form}>
                    <form onSubmit={onFormSubmit} className="p-8 space-y-6">
                        <ActivityFormHeader isEdit={isEdit} onClose={onClose} />

                        <PrimaryDetails
                            lookups={lookups}
                            session={session}
                            clientNames={clientNames}
                        />

                        <LocationDetails
                            lookups={lookups}
                            session={session}
                        />

                        <FinancialDetails
                            lookups={lookups}
                            session={session}
                        />

                        <DateDetails
                            lookups={lookups}
                            session={session}
                        />

                        <div className="pt-4 border-t border-border">
                            <StatusDetails
                                lookups={lookups}
                                session={session}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || session.role === 'READ_ONLY'}
                                className="shadow-lg shadow-primary/20"
                            >
                                {loading ? 'Saving...' : 'Save Activity'}
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <StakeholderDetails
                                lookups={lookups}
                                session={session}
                                lockedUserIds={lockedUserIds}
                            />
                        </div>

                        <CommentsSection
                            comments={localComments}
                            onAddComment={(text) => handleAddComment(text, activity?.id)}
                            isReadOnly={session.role === 'READ_ONLY'}
                            commentText={form.watch('newComment')}
                            onCommentChange={(text) => form.setValue('newComment', text, { shouldDirty: true })}
                            onDeleteComment={handleDeleteComment}
                            currentUserId={session.id}
                            currentUserRole={session.role}
                        />

                        <FileStorageSection
                            activity={activity || null}
                            currentUserId={session.id}
                            currentUserRole={session.role}
                        />

                        {error && <div className="text-destructive text-sm font-medium">{error}</div>}

                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || session.role === 'READ_ONLY'}
                                className="shadow-lg shadow-primary/20"
                            >
                                {loading ? 'Saving...' : 'Save Activity'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>

            <VersionConfirmModal
                isOpen={showVersionConfirm}
                pendingData={pendingData}
                onConfirmSaveAsNew={() => pendingData && processSubmission(pendingData, true)}
                onConfirmUpdate={() => pendingData && processSubmission(pendingData, false)}
                onCancel={() => setShowVersionConfirm(false)}
            />

            <ConfirmationDialog
                isOpen={!!deleteCommentId}
                title="Delete Comment"
                message="Are you sure you want to delete this comment? This action cannot be undone."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={confirmDeleteComment}
                onCancel={() => setDeleteCommentId(null)}
            />
        </div>
    )
}
