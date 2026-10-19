'use client'

import { useState, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useActivityAutoAssignment } from '@/hooks/use-activity-auto-assignment'
import { useActivityComments } from '@/hooks/use-activity-comments'
import { useActivitySubmit } from '@/hooks/use-activity-submit'
import { useActivityOptions } from '@/hooks/use-activity-options'
import {
    PrimaryDetails,
    LocationDetails,
    StakeholderDetails,
    FinancialDetails,
    DateDetails,
    StatusDetails
} from './sections'
import { Lookups, PricingActivityWithHistory, UserSession } from '@/types'
import { activitySchema, ActivityFormValues } from '@/lib/schemas'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { VersionConfirmModal } from './version-confirm-modal'
import { CommentsSection } from './comments-section'
import { FileStorageSection } from './file-storage-section'
import { toast } from 'sonner'

interface ActivityFormProps {
    activity?: PricingActivityWithHistory | null
    lookups: Lookups
    onClose: () => void
    onSuccess: (activity: PricingActivityWithHistory) => void
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
    const { clientNames } = useActivityOptions()
    const [initialVersionId, setInitialVersionId] = useState<string>('')
    const [activeTab, setActiveTab] = useState<string>('details')
    const [autoManagerIds, setAutoManagerIds] = useState<number[]>([])

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
        tcv: activity?.tcv ?? undefined,
        dealDuration: activity?.dealDuration ?? undefined,
        subverticalId: activity?.subverticalId ? String(activity.subverticalId) : undefined,
        dueDate: activity?.dueDate ? new Date(activity.dueDate) : new Date(Date.now() + 86400000),
        clientLocationIds: activity?.clientLocations?.map((l) => l.id) || [],
        deliveryLocationIds: activity?.deliveryLocations?.map((l) => l.id) || [],
        teamMembers: activity?.teamMembers?.map((tm) => ({
            teamId: tm.teamId,
            userId: tm.userId,
            isAutoAdded: tm.isAutoAdded ?? false
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
        // zod v4 + RHF infer mismatch (preprocess/coerce produce `unknown`); cast to the declared form schema type.
        resolver: zodResolver(activitySchema) as unknown as Resolver<ActivityFormValues>,
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

    // Compute manually-added team member count for the tab badge
    const watchedTeamMembers = form.watch('teamMembers') || []
    const autoTeamNames = ['Hierarchical Team', 'Default Team']
    const autoTeamIds = new Set(
        (lookups.teams || [])
            .filter(t => autoTeamNames.includes(t.teamname || t.display || ''))
            .map(t => t.id)
    )
    const manualTeamMemberCount = watchedTeamMembers.filter(m =>
        !lockedUserIds.includes(Number(m.userId)) &&
        !autoManagerIds.includes(Number(m.userId)) &&
        !autoTeamIds.has(Number(m.teamId))
    ).length

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

    const onFormSubmit = form.handleSubmit(handleSubmit, () => {
        toast.error('Please fix the errors in the form before saving.')
    })

    return (
        <div className="h-full overflow-y-auto bg-background">
            <div className="mx-auto max-w-5xl px-6 py-6">
                {/* Page header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={loading}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-2xl font-bold text-foreground">
                            {isEdit ? 'Edit Activity' : 'New Pricing Activity'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="activity-form"
                            disabled={loading || session.role === 'READ_ONLY'}
                            className="shadow-lg shadow-primary/20"
                        >
                            {loading ? 'Saving...' : 'Save Activity'}
                        </Button>
                    </div>
                </div>

                <Form {...form}>
                    <form id="activity-form" onSubmit={onFormSubmit} className="space-y-6 pt-6">
                        {/* Top section: Version, Status, Outcome, Last Activity Date */}
                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Status
                            </h2>
                            <StatusDetails lookups={lookups} session={session} activity={activity} />
                        </div>

                        {/* Tabbed sections */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="location">Location</TabsTrigger>
                                <TabsTrigger value="financials">Financials</TabsTrigger>
                                <TabsTrigger value="team">
                                    Deal Team
                                    {manualTeamMemberCount > 0 && (
                                        <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground">
                                            {manualTeamMemberCount}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="dates">Dates</TabsTrigger>
                                <TabsTrigger value="comments">
                                    Comments
                                    {localComments.length > 0 && (
                                        <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground">
                                            {localComments.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                                {isEdit && activity?.history && activity.history.length > 0 && (
                                    <TabsTrigger value="history">History</TabsTrigger>
                                )}
                            </TabsList>

                            <TabsContent value="details" className="pt-6">
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Primary Details
                                    </h2>
                                    <PrimaryDetails
                                        lookups={lookups}
                                        session={session}
                                        clientNames={clientNames}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="location" className="pt-6">
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Locations
                                    </h2>
                                    <LocationDetails lookups={lookups} session={session} />
                                </div>
                            </TabsContent>

                            <TabsContent value="financials" className="pt-6">
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Financials
                                    </h2>
                                    <FinancialDetails lookups={lookups} session={session} />
                                </div>
                            </TabsContent>

                            <TabsContent value="team" className="pt-6">
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <StakeholderDetails
                                        lookups={lookups}
                                        session={session}
                                        lockedUserIds={lockedUserIds}
                                        ownerId={activity?.userId || session.id}
                                        autoManagerIds={autoManagerIds}
                                        onAutoManagerIdsChange={setAutoManagerIds}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="dates" className="pt-6">
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Dates
                                    </h2>
                                    <DateDetails lookups={lookups} session={session} />
                                </div>
                            </TabsContent>

                            <TabsContent value="comments" className="pt-6">
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <CommentsSection
                                        comments={localComments}
                                        onAddComment={(text) => handleAddComment(text, activity?.id)}
                                        isReadOnly={session.role === 'READ_ONLY'}
                                        commentText={form.watch('newComment')}
                                        onCommentChange={(text) => form.setValue('newComment', text, { shouldDirty: true })}
                                        onDeleteComment={handleDeleteComment}
                                        currentUserId={session.id}
                                        currentUserRole={session.role}
                                        className="border-t-0 pt-0"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="attachments" className="pt-6">
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <FileStorageSection
                                        activity={activity || null}
                                        currentUserId={session.id}
                                        currentUserRole={session.role}
                                        className="border-t-0 pt-0"
                                    />
                                </div>
                            </TabsContent>

                            {isEdit && activity?.history && activity.history.length > 0 && (
                                <TabsContent value="history" className="pt-6">
                                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                            Activity History
                                        </h2>
                                        <div className="space-y-3">
                                            {activity.history.map((entry, i) => (
                                                <div key={entry.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                                                    <div className="flex flex-col items-center pt-1">
                                                        <div className={`h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                                                        {i < activity.history.length - 1 && (
                                                            <div className="w-px h-full bg-border mt-1" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 text-sm">
                                                            <span className="font-medium text-foreground">
                                                                {entry.version?.display || entry.version?.version || 'Unknown'}
                                                            </span>
                                                            <span className="text-muted-foreground">|</span>
                                                            <span className="text-muted-foreground">
                                                                {entry.status?.display || entry.status?.status || 'Unknown'}
                                                            </span>
                                                            <span className="text-muted-foreground">|</span>
                                                            <span className="text-muted-foreground">
                                                                {entry.outcome?.display || entry.outcome?.outcome || 'Unknown'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {entry.user?.name || 'Unknown'} &middot;{' '}
                                                            {new Date(entry.createdAt).toLocaleDateString(undefined, {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            )}
                        </Tabs>

                        {error && <div className="text-destructive text-sm font-medium">{error}</div>}
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
