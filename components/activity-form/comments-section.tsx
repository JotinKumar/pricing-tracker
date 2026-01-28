'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Trash } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Comment {
    id: number
    text: string
    createdAt: Date | string
    user: {
        id: number
        name: string | null
        email: string
        avatar?: string | null
    }
}


interface CommentsSectionProps {
    comments: Comment[]
    onAddComment: (text: string) => void
    isReadOnly?: boolean
    commentText?: string
    onCommentChange?: (text: string) => void
    onDeleteComment?: (id: number) => void
    currentUserId?: number
    currentUserRole?: string
}

export function CommentsSection({
    comments,
    onAddComment,
    isReadOnly = false,
    commentText = '',
    onCommentChange,
    onDeleteComment,
    currentUserId,
    currentUserRole
}: CommentsSectionProps) {
    const [internalComment, setInternalComment] = useState('')

    // Use props if provided, otherwise internal state
    const isControlled = onCommentChange !== undefined
    const currentComment = isControlled ? commentText : internalComment

    const handleChange = (val: string) => {
        if (isControlled && onCommentChange) {
            onCommentChange(val)
        } else {
            setInternalComment(val)
        }
    }

    const handleSave = () => {
        if (!currentComment.trim()) return
        onAddComment(currentComment)
        // Clear logic
        if (!isControlled) {
            setInternalComment('')
        }
        // If controlled, parent handles clearing usually, or we assume onAddComment success implies clear?
        // Actually parent knows best. But for UX we might want to clear immediately?
        // Let's rely on parent clearing the prop if controlled.
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSave()
        }
    }

    return (
        <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Comments</h3>

            <div className="grid grid-cols-1 gap-4">
                {/* Comment Input */}
                {!isReadOnly && (
                    <div className="relative">
                        <Textarea
                            value={currentComment}
                            onChange={(e) => handleChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add a comment..."
                            rows={3}
                            className="resize-none pr-12 min-h-[80px]"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute bottom-2 right-2 h-8 w-8 hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            onClick={handleSave}
                            disabled={!currentComment.trim()}
                            title="Save Comment"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Comment History - Tabular Format */}
                {comments.length > 0 ? (
                    <div className="border border-input rounded-md overflow-hidden bg-background">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-border">
                                {comments.map((comment) => (
                                    <tr key={comment.id} className="group hover:bg-muted/10 transition-colors">
                                        <td className="p-3 w-[200px] align-top bg-muted/5 border-r border-border">
                                            <div className="flex items-center justify-between gap-2"> {/* Added justify-between */}
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={comment.user.avatar || undefined} />
                                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                            {comment.user.name?.charAt(0) || comment.user.email.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-xs truncate max-w-[100px]" title={comment.user.name || comment.user.email}> {/* Adj max-width */}
                                                            {comment.user.name || comment.user.email}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {new Date(comment.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Delete Action */}
                                                {!isReadOnly && onDeleteComment && (
                                                    currentUserRole === 'ADMIN' ||
                                                    (currentUserId !== undefined && currentUserId === comment.user.id)
                                                ) && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => onDeleteComment(comment.id)}
                                                            title="Delete comment"
                                                        >
                                                            <Trash className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                            </div>
                                        </td>
                                        <td className="p-3 align-top text-foreground">
                                            <div className="whitespace-pre-wrap">{comment.text}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm border border-input rounded-md border-dashed bg-muted/10">
                        No comments yet.
                    </div>
                )}
            </div>
        </div>
    )
}
