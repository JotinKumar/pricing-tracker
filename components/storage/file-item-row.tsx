'use client'

import { FileIcon, Trash2, Download, StickyNote } from 'lucide-react'
import { Attachment } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { updateAttachmentNotes } from '@/lib/actions/storage'
import { toast } from 'sonner'

interface FileItemRowProps {
    file: Attachment & { user: { name: string | null; email: string; image: string | null } }
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
        <div className="group flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-all">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileIcon className="h-5 w-5" />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center gap-2">
                    <span className="font-medium truncate" title={file.filePath || ''}>
                        {file.filePath ? file.filePath.split('/').pop() : 'Unknown File'}
                    </span>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 h-5">
                        {file.fileType}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <div className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                            <AvatarImage src={file.user.image || undefined} />
                            <AvatarFallback className="text-[9px]">
                                {file.user.name?.charAt(0) || file.user.email.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span>{file.user.name || file.user.email}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(file.createdAt).toLocaleString()}</span>
                </div>

                {file.notes && !isEditingNote && (
                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 p-1.5 rounded-md">
                        <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{file.notes}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Popover open={isEditingNote} onOpenChange={setIsEditingNote}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <StickyNote className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="end">
                        <div className="space-y-2">
                            <h4 className="font-medium text-xs">File Notes</h4>
                            <Textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Add a note..."
                                className="h-20 text-xs resize-none"
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingNote(false)} className="h-7 text-xs">Cancel</Button>
                                <Button size="sm" onClick={handleSaveNote} disabled={isSavingNote} className="h-7 text-xs">
                                    {isSavingNote ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                    <a href={file.filePath || '#'} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" />
                    </a>
                </Button>

                {canDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(file.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
