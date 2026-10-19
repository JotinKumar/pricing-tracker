'use client'

import { FileIcon, Trash, Download, MessageSquare, Send } from 'lucide-react'
import { Attachment } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useState } from 'react'
import { updateAttachmentNotes } from '@/lib/actions/storage'
import { toast } from 'sonner'

interface FileItemRowProps {
    file: Attachment & { user?: { name: string | null; email: string; avatar: string | null } }
    currentUserId: number
    currentUserRole: string
    onDelete: (id: number) => void
    onUpdateNote: (id: number, note: string) => void
}

export function FileItemRow({ file, currentUserId, currentUserRole, onDelete, onUpdateNote }: FileItemRowProps) {
    const [isEditingNote, setIsEditingNote] = useState(false)
    const [noteContent, setNoteContent] = useState(file.notes || '')
    const [isSavingNote, setIsSavingNote] = useState(false)

    const isOwner = file.userId === currentUserId
    const canDelete = isOwner || currentUserRole === 'ADMIN'

    const handleSaveNote = async () => {
        setIsSavingNote(true)
        try {
            await updateAttachmentNotes(file.id, noteContent)
            toast.success('Note saved')
            onUpdateNote(file.id, noteContent)
            setIsEditingNote(false)
        } catch {
            toast.error('Failed to save note')
        } finally {
            setIsSavingNote(false)
        }
    }

    return (
        <tr className="group hover:bg-muted/10 transition-colors">
            {/* Left Column: User Info */}
            <td className="p-3 w-[200px] align-top bg-muted/5 border-r border-border">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={file.user?.avatar || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {file.user?.name?.charAt(0) || file.user?.email.charAt(0) || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-xs truncate max-w-[100px]" title={file.user?.name || file.user?.email || '?'}>
                                {file.user?.name || file.user?.email || '?'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {new Date(file.createdAt).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Delete Action (Moved to left column matching Comments) */}
                    {canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(file.id)
                            }}
                            title="Delete file"
                        >
                            <Trash className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </td>

            {/* Right Column: File Content */}
            <td className="p-3 align-top text-foreground">
                <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileIcon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate max-w-[300px]" title={file.filePath || ''}>
                                        {file.fileName || (file.filePath ? file.filePath.split('/').pop() : 'Unknown File')}
                                    </span>

                                    {/* MessageSquare Icon for Notes - Toggle Edit Mode */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="focus:outline-none"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setIsEditingNote(!isEditingNote)
                                                    }}
                                                >
                                                    <MessageSquare
                                                        className={`h-3.5 w-3.5 cursor-pointer transition-colors ${file.notes ? "fill-current text-primary" : "text-muted-foreground hover:text-primary"}`}
                                                    />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">{file.notes || "Add Note"}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                <span className="inline-flex items-center w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground h-4">
                                    {file.fileType}
                                </span>
                                {file.location && (
                                    <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border/50 transition-colors hover:bg-muted/50">
                                        Loc: {file.location}
                                    </span>
                                )}

                            </div>
                        </div>

                        {/* Download Action */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                            <a href={`/storage/uploads/${file.filePath}`} target="_blank" rel="noopener noreferrer" download>
                                <Download className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>

                    {isEditingNote ? (
                        <div className="relative mt-2" onClick={(e) => e.stopPropagation()}>
                            <Textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSaveNote();
                                    }
                                    e.stopPropagation();
                                }}
                                placeholder="Add a note..."
                                className="resize-none pr-12 min-h-[60px] text-xs"
                                autoFocus
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute bottom-2 right-2 h-7 w-7 hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleSaveNote()
                                }}
                                disabled={isSavingNote}
                                title="Save Note"
                            >
                                <Send className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ) : null}
                </div>
            </td>
        </tr>
    )
}
