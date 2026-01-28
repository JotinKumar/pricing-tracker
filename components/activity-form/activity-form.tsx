'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitActivity } from '@/lib/actions/activity'
import { useActivityAutoAssignment } from '@/hooks/use-activity-auto-assignment'
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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { CommentsSection } from './comments-section'
import { FileStorageSection } from './file-storage-section'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface ActivityFormProps {
    activity?: PricingActivity | null
    lookups: Lookups
    onClose: () => void
    onSuccess: (activity: PricingActivity) => void
    session: UserSession
    isEdit?: boolean
}

export default function ActivityForm({ activity, lookups, onClose, onSuccess, session, isEdit = false }: ActivityFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [clientNames, setClientNames] = useState<string[]>([])

    // Fetch unique clients on mount
    useEffect(() => {
        // Dynamic import to avoid circular dependencies if any, though likely safe to import normally
        import('@/lib/actions/activity').then(({ getUniqueClients }) => {
            getUniqueClients().then(res => {
                if (res.success && res.data) {
                    setClientNames(res.data)
                }
            })
        })
    }, [])

    const defaultValues: Partial<ActivityFormValues> = {
        id: activity?.id,
        id1: (activity as any)?.id1 || (activity as any)?.salesForceId || '', // Handle migration/renaming
        id2: (activity as any)?.id2 || (activity as any)?.dsrNumber || '',
        clientName: activity?.clientName || '',
        projectName: activity?.projectName || '',
        verticalId: String(activity?.verticalId || lookups.verticals?.[0]?.id || ''),
        horizontalId: String(activity?.horizontalId || lookups.horizontals?.find((h: any) => h.horizontal === 'Regular')?.id || lookups.horizontals?.[0]?.id || ''),
        annualContractValue: activity?.annualContractValue || 0,
        dueDate: activity?.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] as any : new Date(Date.now() + 86400000).toISOString().split('T')[0] as any,

        // Multi-select state
        clientLocationIds: activity?.clientLocations?.map((l: any) => l.id) || [],
        deliveryLocationIds: activity?.deliveryLocations?.map((l: any) => l.id) || [],

        // Dynamic Team Members
        teamMembers: (activity as any)?.teamMembers?.map((tm: any) => ({
            teamId: tm.teamId,
            userId: tm.userId
        })) || [],

        assignDate: activity?.assignDate ? new Date(activity.assignDate).toISOString().split('T')[0] as any : new Date().toISOString().split('T')[0] as any,
        statusId: String(activity?.statusId || lookups.statuses?.[0]?.id || ''),
        categoryId: String(activity?.categoryId || lookups.categories?.[0]?.id || ''),
        versionId: String(activity?.versionId || lookups.versions?.[0]?.id || ''),
        outcomeId: String(activity?.outcomeId || lookups.outcomes?.find((o: any) => o.outcome === 'Pipeline')?.id || ''),
        newComment: '', // Always empty for new comments
        isActive: true
    }

    const form = useForm<ActivityFormValues>({
        resolver: zodResolver(activitySchema) as any,
        defaultValues
    })

    const [initialVersionId, setInitialVersionId] = useState<string>('')
    const [showVersionConfirm, setShowVersionConfirm] = useState(false)
    const [pendingData, setPendingData] = useState<ActivityFormValues | null>(null)

    useEffect(() => {
        if (isEdit && activity?.versionId) {
            setInitialVersionId(String(activity.versionId))
        }
    }, [isEdit, activity])

    // --- Auto-Assignment Logic ---
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
    // -----------------------------

    const processSubmission = async (data: ActivityFormValues, asNew: boolean = false) => {
        setLoading(true)
        setError('')
        setShowVersionConfirm(false)

        const payload = { ...data }
        if (asNew) {
            delete payload.id
        }

        const result = await submitActivity(payload)

        if (result.success && result.activity) {
            onSuccess(result.activity)
        } else {
            setError(result.message || 'Operation failed')
            setLoading(false)
        }
    }

    const onSubmit = async (data: ActivityFormValues) => {
        if (isEdit && initialVersionId && data.versionId !== initialVersionId) {
            setPendingData(data)
            setShowVersionConfirm(true)
            return
        }

        await processSubmission(data)
    }

    // Cast comments to array safely - and merge with local state if we want to show new ones immediately
    // Ideally we should initialize a state with props.activity.comments
    const [localComments, setLocalComments] = useState<any[]>((activity as any)?.comments || [])
    const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null)

    // Sync if activity changes (e.g. after save success)
    useEffect(() => {
        if (activity?.comments) {
            setLocalComments(activity.comments)
        }
    }, [activity])

    // New Comment Handler
    const handleAddComment = async (text: string) => {
        if (activity?.id) {
            // Immediate save for existing activity
            try {
                // We need to import addComment dynamically or ensure it's imported
                const { addComment } = await import('@/lib/actions/activity')
                const res = await addComment(activity.id, text)

                if (res.success && res.comment) {
                    toast.success("Comment added")
                    setLocalComments(prev => [res.comment, ...prev])
                    form.setValue('newComment', '') // Clear input
                } else {
                    toast.error(res.message || "Failed to add comment")
                }
            } catch (err) {
                toast.error("Error adding comment")
            }
        } else {
            // For new activity, just update form state (staging)
            form.setValue('newComment', text)
            toast.info("Comment staged. Will be saved when you click 'Save Activity'.")
        }
    }

    // Cast comments to array safely
    const existingComments = (activity as any)?.comments || []
    // If pending comment exists in form, maybe show it? (Not implemented in backend return yet)

    const handleDeleteComment = (commentId: number) => {
        setDeleteCommentId(commentId)
    }

    const confirmDeleteComment = async () => {
        if (!deleteCommentId) return

        try {
            const { deleteComment } = await import('@/lib/actions/activity')
            const res = await deleteComment(deleteCommentId)

            if (res.success) {
                toast.success("Comment deleted")
                setLocalComments(prev => prev.filter(c => c.id !== deleteCommentId))
            } else {
                toast.error(res.message || "Failed to delete comment")
            }
        } catch (err) {
            toast.error("Error deleting comment")
        } finally {
            setDeleteCommentId(null)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-background shadow-2xl">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
                        <ActivityFormHeader isEdit={isEdit} onClose={onClose} />

                        {/* Primary with Client Dropdown */}
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

                        {/* Swapped Order: Status before Stakeholder */}
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

                        {/* Comments Section */}
                        <CommentsSection
                            comments={localComments}
                            onAddComment={handleAddComment}
                            isReadOnly={session.role === 'READ_ONLY'}
                            commentText={form.watch('newComment')}
                            onCommentChange={(text) => form.setValue('newComment', text, { shouldDirty: true })}
                            onDeleteComment={handleDeleteComment}
                            currentUserId={session.id}
                            currentUserRole={session.role}
                        />

                        {/* Project Files Section */}
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

            {/* Version Change Confirmation Modal */}
            {showVersionConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-6 ring-1 ring-border space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-foreground">Version Change Detected</h3>
                            <p className="text-sm text-muted-foreground">
                                You have changed the version of this activity. Do you want to save this as a new activity or update the existing one?
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                            <Button
                                onClick={() => pendingData && processSubmission(pendingData, true)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                                Save as New Activity
                            </Button>
                            <Button
                                onClick={() => pendingData && processSubmission(pendingData, false)}
                                variant="outline"
                                className="w-full"
                            >
                                Update Existing Activity
                            </Button>
                            <Button
                                onClick={() => setShowVersionConfirm(false)}
                                variant="ghost"
                                className="w-full text-muted-foreground"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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

function ActivityFormHeader({ isEdit, onClose }: { isEdit: boolean; onClose: () => void }) {
    return (
        <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-foreground">{isEdit ? 'Edit Activity' : 'New Pricing Activity'}</h2>
            <button type="button" onClick={onClose} className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-muted/80">
                ✕
            </button>
        </div>
    )
}
