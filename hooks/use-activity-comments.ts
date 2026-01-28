'use client'

import { useState, useEffect, useCallback } from 'react'
import { Comment, PricingActivity } from '@/types'
import { toast } from 'sonner'

interface UseActivityCommentsProps {
    activity: PricingActivity | null | undefined
}

interface UseActivityCommentsReturn {
    localComments: Comment[]
    deleteCommentId: number | null
    handleAddComment: (text: string, activityId?: number) => Promise<void>
    handleDeleteComment: (commentId: number) => void
    confirmDeleteComment: () => Promise<void>
    setDeleteCommentId: (id: number | null) => void
}

export function useActivityComments({ activity }: UseActivityCommentsProps): UseActivityCommentsReturn {
    const [localComments, setLocalComments] = useState<Comment[]>((activity)?.comments || [])
    const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null)

    // Sync if activity changes (e.g. after save success)
    useEffect(() => {
        if (activity?.comments) {
            setLocalComments(activity.comments)
        }
    }, [activity])

    const handleAddComment = useCallback(async (text: string, activityId?: number) => {
        if (activityId) {
            // Immediate save for existing activity
            try {
                const { addComment } = await import('@/lib/actions/activity')
                const res = await addComment(activityId, text)

                if (res.success && res.comment) {
                    toast.success("Comment added")
                    setLocalComments(prev => [res.comment, ...prev])
                } else {
                    toast.error(res.message || "Failed to add comment")
                }
            } catch (err) {
                toast.error("Error adding comment")
            }
        } else {
            // For new activity, just show info (staging handled by form)
            toast.info("Comment staged. Will be saved when you click 'Save Activity'.")
        }
    }, [])

    const handleDeleteComment = useCallback((commentId: number) => {
        setDeleteCommentId(commentId)
    }, [])

    const confirmDeleteComment = useCallback(async () => {
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
    }, [deleteCommentId])

    return {
        localComments,
        deleteCommentId,
        handleAddComment,
        handleDeleteComment,
        confirmDeleteComment,
        setDeleteCommentId
    }
}
