'use client'

import { CommentsSection } from '@/components/activity-form/comments-section'
import { Button } from '@/components/ui/button'
import { X, MessageSquare } from 'lucide-react'
import { PricingActivity } from '@/types'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { addComment, deleteComment } from '@/lib/actions/activity'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ActivityRefDisplay } from './activity-ref-display'

interface CommentsModalProps {
    isOpen: boolean
    onClose: () => void
    activity: PricingActivity | null
    currentUserId: number
    currentUserRole?: string
}

export function CommentsModal({ isOpen, onClose, activity, currentUserId, currentUserRole }: CommentsModalProps) {
    const [localComments, setLocalComments] = useState<any[]>([])
    const [commentText, setCommentText] = useState('')
    const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null)

    useEffect(() => {
        if (activity?.comments) {
            setLocalComments(activity.comments)
        } else {
            setLocalComments([])
        }
    }, [activity])

    const handleAddComment = async (text: string) => {
        if (!activity?.id) return

        try {
            const res = await addComment(activity.id, text)
            if (res.success && res.comment) {
                toast.success("Comment added")
                setLocalComments(prev => [res.comment, ...prev])
                setCommentText('')
            } else {
                toast.error(res.message || "Failed to add comment")
            }
        } catch (err) {
            toast.error("Error adding comment")
            console.error(err)
        }
    }

    const handleDeleteComment = (id: number) => {
        setDeleteCommentId(id)
    }

    const confirmDeleteComment = async () => {
        if (!deleteCommentId) return

        try {
            const res = await deleteComment(deleteCommentId)
            if (res.success) {
                toast.success("Comment deleted")
                setLocalComments(prev => prev.filter(c => c.id !== deleteCommentId))
            } else {
                toast.error(res.message || "Failed to delete comment")
            }
        } catch (err) {
            toast.error("Error deleting comment")
            console.error(err)
        } finally {
            setDeleteCommentId(null)
        }
    }


    if (!activity || !isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden ring-1 ring-border max-h-[85vh] flex flex-col">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Comments - {activity.projectName} <ActivityRefDisplay activity={activity} className="ml-2 font-normal text-muted-foreground" />
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <CommentsSection
                        comments={localComments}
                        onAddComment={handleAddComment}
                        isReadOnly={currentUserRole === 'READ_ONLY'}
                        commentText={commentText}
                        onCommentChange={setCommentText}
                        onDeleteComment={handleDeleteComment}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                    />
                </div>
            </div>

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
