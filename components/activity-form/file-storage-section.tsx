'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, FileIcon, Trash, MessageSquare, StickyNote } from 'lucide-react'
import { PricingActivity } from '@/types'
import { uploadAttachment, getAttachments, deleteAttachment, getDocumentTypes, updateAttachmentNotes } from '@/lib/actions/storage'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface FileStorageSectionProps {
    activity: PricingActivity | null
    currentUserId: number
    currentUserRole?: string
}

interface Attachment {
    id: number
    fileName: string
    fileType: string
    createdAt: Date
    user: {
        id: number
        name: string | null
        email: string
        avatar?: string | null
    }
    notes?: string
    filePath?: string
}

const FILE_TYPES = [
    'Solution Inputs',
    'Pricing Summary',
    'Talent Acquisition Inputs',
    'Meeting Summaries',
    'Others'
]

export function FileStorageSection({ activity, currentUserId, currentUserRole }: FileStorageSectionProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedType, setSelectedType] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const [fileTypes, setFileTypes] = useState<string[]>([])
    const [noteContent, setNoteContent] = useState('')

    // Edit Mode State
    const [editingFileId, setEditingFileId] = useState<number | null>(null)

    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    useEffect(() => {
        // Fetch document types
        getDocumentTypes().then(types => {
            if (types.length > 0) setFileTypes(types)
            else setFileTypes(FILE_TYPES) // Fallback
        })
    }, [])

    const resetForm = () => {
        setFile(null)
        setSelectedType('')
        setNoteContent('')
        setEditingFileId(null)
        const fileInput = document.getElementById('file-upload-section') as HTMLInputElement
        if (fileInput) fileInput.value = ''
    }

    useEffect(() => {
        if (activity) {
            loadAttachments()
        } else {
            resetForm()
            setAttachments([])
        }
    }, [activity])

    const loadAttachments = async () => {
        if (!activity) return
        setIsLoading(true)
        try {
            // Use id1 (formerly salesForceId) instead of activity.id
            const activityId1 = (activity as any).id1 || (activity as any).salesForceId || ''
            if (!activityId1) {
                setAttachments([])
                return
            }
            const data = await getAttachments(activityId1)
            setAttachments(data as any)
        } catch (error) {
            console.error('Failed to load attachments', error)
        } finally {
            setIsLoading(false)
        }
    }

    const sortedAttachments = [...attachments].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

    const handleUpload = async () => {
        if (!file || !selectedType || !activity) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileType', selectedType)
        // Pass id1 (formerly salesForceId)
        const activityId1 = (activity as any).id1 || (activity as any).salesForceId || ''
        formData.append('salesForceId', activityId1)
        formData.append('userId', currentUserId.toString())

        if (noteContent.trim()) {
            formData.append('notes', noteContent.trim())
        }

        try {
            await uploadAttachment(formData)
            await loadAttachments()
            resetForm()
        } catch (error) {
            console.error('Upload failed', error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSaveNotes = async () => {
        if (!editingFileId || !activity) return

        setIsUploading(true)
        try {
            await updateAttachmentNotes(editingFileId, noteContent.trim())
            await loadAttachments()
            resetForm() // Exit edit mode
        } catch (error) {
            console.error('Update notes failed', error)
        } finally {
            setIsUploading(false)
        }
    }

    const startEditing = (attachment: Attachment) => {
        setEditingFileId(attachment.id)
        setNoteContent(attachment.notes || '')
        // Scroll logic might need adjustment since it's embedded now, but we can leave it or remove it.
        // If embedded, scrolling 'overflow-y-auto' might target the activity form container.
        const modalContent = document.querySelector('.overflow-y-auto') // This might still work for the activity form modal
        if (modalContent) modalContent.scrollTop = 0 // Optional: scroll to top of form might be too much? 
        // Maybe just focus the textarea?
        const textarea = document.getElementById('note-textarea')
        if (textarea) textarea.focus()
    }

    const handleDelete = async (id: number) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete File',
            message: 'Are you sure you want to delete this file?',
            onConfirm: async () => {
                try {
                    await deleteAttachment(id)
                    setAttachments(prev => prev.filter(a => a.id !== id))
                    if (editingFileId === id) resetForm()
                } catch (error) {
                    console.error('Delete failed', error)
                }
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            }
        })
    }

    const handleDownload = (id: number) => {
        window.open(`/api/storage/${id}`, '_blank')
    }

    if (!activity) {
        return (
            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Project Files</h3>
                <div className="text-center py-6 text-muted-foreground text-sm border border-input rounded-md border-dashed bg-muted/10">
                    Please save the activity to upload files.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Project Files</h3>
                {/* Optional: Add a small count badge or something? */}
            </div>

            <div className="flex flex-col gap-6">
                {/* Upload / Edit Section */}
                <div className={cn("bg-muted/30 p-4 rounded-lg border border-border flex flex-col gap-4 shrink-0 transition-colors", editingFileId ? "bg-primary/5 border-primary/20" : "")}>
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            {editingFileId ? (
                                <>
                                    <StickyNote className="w-4 h-4 text-primary" />
                                    Editing Notes for: <span className="text-primary italic">{attachments.find(a => a.id === editingFileId)?.fileName}</span>
                                </>
                            ) : (
                                "Upload New File"
                            )}
                        </h3>
                        {editingFileId && (
                            <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="h-6 text-xs text-muted-foreground hover:text-foreground">
                                Cancel Edit
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Row 1: Type & File (Only show in Upload Mode) */}
                        {!editingFileId && (
                            <div className="flex gap-4 sm:flex-row flex-col">
                                <div className="w-full sm:w-1/2 space-y-1.5">
                                    <Label>Document Type</Label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fileTypes.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full sm:w-1/2 space-y-1.5">
                                    <Label>File</Label>
                                    <Input
                                        id="file-upload-section"
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Row 2: Notes & Action Button (Inline) */}
                        <div className="flex gap-4 items-end">
                            <div className="space-y-1.5 flex-1">
                                <Label>Notes {editingFileId ? "(Edit)" : "(Optional)"}</Label>
                                <Textarea
                                    id="note-textarea"
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder={editingFileId ? "Update notes..." : "Add notes..."}
                                    className="min-h-[60px] h-[60px] resize-none"
                                />
                            </div>

                            <div className="shrink-0 pb-1">
                                {editingFileId ? (
                                    <Button
                                        type="button"
                                        onClick={handleSaveNotes}
                                        disabled={isUploading}
                                        className="w-full sm:w-auto h-[50px]"
                                    >
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <StickyNote className="w-4 h-4 mr-2" />}
                                        Save Notes
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleUpload}
                                        disabled={!file || !selectedType || isUploading}
                                        className="w-full sm:w-auto h-[50px]"
                                    >
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                        Upload
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Files Table */}
                {sortedAttachments.length > 0 ? (
                    <div className="overflow-auto rounded-md border border-input bg-background max-h-[400px]">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-border">
                                {isLoading && attachments.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="p-8 text-center text-muted-foreground">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Loading files...
                                        </td>
                                    </tr>
                                ) : (
                                    sortedAttachments.map(file => {
                                        const hasNotes = !!file.notes && file.notes.trim().length > 0
                                        const canDelete = currentUserRole === 'ADMIN' || file.user.id === currentUserId

                                        return (
                                            <tr key={file.id}
                                                className={cn("group hover:bg-muted/10 transition-colors", editingFileId === file.id ? "bg-primary/5" : "")}
                                            >
                                                {/* Left Column: Metadata, Avatar, Delete Icon */}
                                                <td className="p-3 w-[240px] align-top bg-muted/5 border-r border-border">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-end gap-3">
                                                                <Avatar className="h-6 w-6 mb-1 shrink-0">
                                                                    {file.user.avatar ? (
                                                                        <AvatarImage src={file.user.avatar} />
                                                                    ) : (
                                                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary flex items-center justify-center w-full h-full rounded-full">
                                                                            {file.user.name?.charAt(0) || file.user.email.charAt(0)}
                                                                        </AvatarFallback>
                                                                    )}
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-semibold text-sm text-foreground mb-0.5">{file.fileType}</div>
                                                                    <div className="text-xs text-muted-foreground truncate max-w-[120px]" title={file.user.name || file.user.email}>
                                                                        {file.user.name || file.user.email}
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                                        {new Date(file.createdAt).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Delete Action (Left Side) */}
                                                            {canDelete && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => handleDelete(file.id)}
                                                                    title="Delete"
                                                                >
                                                                    <Trash className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Right Column: File, Note Icon, Download */}
                                                <td className="p-3 align-top">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                                            {file.fileType !== 'Note' ? (
                                                                <span
                                                                    className="truncate cursor-pointer hover:underline text-foreground font-medium"
                                                                    title={file.fileName}
                                                                    onClick={() => handleDownload(file.id)}
                                                                >
                                                                    {file.fileName}
                                                                </span>
                                                            ) : (
                                                                <span className="text-foreground italic">Legacy Note</span>
                                                            )}
                                                        </div>

                                                        {/* Actions: Download & Note Icon */}
                                                        <div className="flex items-center gap-2">
                                                            {/* Notes Icon Button (Right Side) */}
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => startEditing(file)}
                                                                            className={cn(
                                                                                "p-1.5 rounded-md transition-all shrink-0",
                                                                                hasNotes
                                                                                    ? "text-primary hover:bg-primary/10"
                                                                                    : "text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100"
                                                                            )}
                                                                            style={{ opacity: hasNotes ? 1 : undefined }}
                                                                        >
                                                                            <MessageSquare className={cn("w-4 h-4", hasNotes && "fill-current")} />
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="right" className="max-w-[300px] whitespace-pre-wrap">
                                                                        {hasNotes ? file.notes : "No notes. Click to add."}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>

                                                            {file.fileType !== 'Note' && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => handleDownload(file.id)}
                                                                    title="Download"
                                                                >
                                                                    <Upload className="w-4 h-4 rotate-180" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm border border-input rounded-md border-dashed bg-muted/10">
                        No files uploaded yet.
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    )
}
