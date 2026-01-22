'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, FileIcon, Trash2, X, ArrowDown, ArrowUp } from 'lucide-react'
import { PricingActivity } from '@/types'
import { uploadAttachment, getAttachments, deleteAttachment, getDocumentTypes, addNote } from '@/lib/actions/storage'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

interface StorageModalProps {
    isOpen: boolean
    onClose: () => void
    activity: PricingActivity | null
    currentUserId: number
}

interface Attachment {
    id: number
    fileName: string
    fileType: string
    createdAt: Date
    user: { name: string }
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

export function StorageModal({ isOpen, onClose, activity, currentUserId }: StorageModalProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedType, setSelectedType] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const [fileTypes, setFileTypes] = useState<string[]>([])
    const [noteContent, setNoteContent] = useState('')
    const [isAddingNote, setIsAddingNote] = useState(false)
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

    useEffect(() => {
        if (isOpen && activity) {
            loadAttachments()
        } else {
            setAttachments([])
            setFile(null)
            setSelectedType('')
        }
    }, [isOpen, activity])

    const loadAttachments = async () => {
        if (!activity) return
        setIsLoading(true)
        try {
            // Use id1 (formerly salesForceId) instead of activity.id
            const activityId1 = (activity as any).id1 || (activity as any).salesForceId || ''
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

    const toggleSort = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    }

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

        try {
            await uploadAttachment(formData)
            await loadAttachments()
            setFile(null)
            setSelectedType('')
            // Reset file input value
            const fileInput = document.getElementById('file-upload') as HTMLInputElement
            if (fileInput) fileInput.value = ''
        } catch (error) {
            console.error('Upload failed', error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleAddNote = async () => {
        if (!noteContent.trim() || !activity) return

        setIsAddingNote(true)
        try {
            const activityId1 = (activity as any).id1 || (activity as any).salesForceId || ''
            await addNote(activityId1, currentUserId, noteContent)
            await loadAttachments()
            setNoteContent('')
        } catch (error) {
            console.error('Add note failed', error)
        } finally {
            setIsAddingNote(false)
        }
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

    if (!activity || !isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden ring-1 ring-border max-h-[85vh] flex flex-col">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="font-bold text-foreground">Project Files - {activity.projectName} / SF ID: {(activity as any).id1 || (activity as any).salesForceId || ''}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex flex-col gap-6 p-6 overflow-hidden flex-1">
                    {/* Upload Section */}
                    <div className="bg-muted/30 p-4 rounded-lg border border-border flex flex-col gap-4 shrink-0">
                        <h3 className="font-semibold text-sm">Upload New File</h3>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1.5">
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
                            <div className="flex-1 space-y-1.5">
                                <Label>File</Label>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="cursor-pointer"
                                />
                            </div>
                            <Button
                                onClick={handleUpload}
                                disabled={!file || !selectedType || isUploading}
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                Upload
                            </Button>
                        </div>
                    </div>

                    {/* Add Note Section */}
                    <div className="bg-muted/30 p-4 rounded-lg border border-border flex flex-col gap-4 shrink-0">
                        <h3 className="font-semibold text-sm">Add Note</h3>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1.5">
                                <Label>Note Content</Label>
                                <Textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="Enter your notes here..."
                                    className="min-h-[80px]"
                                />
                            </div>
                            <Button
                                onClick={handleAddNote}
                                disabled={!noteContent.trim() || isAddingNote}
                            >
                                {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Add notes
                            </Button>
                        </div>
                    </div>

                    {/* Files Table */}
                    <div className="flex-1 overflow-auto rounded-md border text-sm min-h-0">
                        <table className="w-full text-left">
                            <thead className="bg-muted text-muted-foreground font-medium sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 whitespace-nowrap">Type</th>
                                    <th className="p-3 w-full">File Name</th>
                                    <th className="p-3 whitespace-nowrap">Uploaded By</th>
                                    <th
                                        className="p-3 whitespace-nowrap cursor-pointer hover:text-foreground flex items-center gap-1"
                                        onClick={toggleSort}
                                        title="Click to sort"
                                    >
                                        Date
                                        {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                    </th>
                                    <th className="p-3 whitespace-nowrap text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Loading files...
                                        </td>
                                    </tr>
                                ) : sortedAttachments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No files uploaded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedAttachments.map(file => (
                                        <tr key={file.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-3 font-medium whitespace-nowrap">{file.fileType}</td>
                                            <td className="p-3 flex items-center gap-2">
                                                <FileIcon className="w-4 h-4 text-primary shrink-0" />
                                                {file.fileType !== 'Note' ? (
                                                    <span
                                                        className="truncate max-w-[300px] cursor-pointer hover:underline text-foreground"
                                                        title={file.fileName}
                                                        onClick={() => handleDownload(file.id)}
                                                    >
                                                        {file.fileName}
                                                    </span>
                                                ) : (
                                                    <span className="text-foreground whitespace-pre-wrap">{file.notes}</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-muted-foreground whitespace-nowrap">{file.user?.name}</td>
                                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                                                {new Date(file.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right whitespace-nowrap">
                                                {file.fileType !== 'Note' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary mr-1"
                                                        onClick={() => handleDownload(file.id)}
                                                        title="Download"
                                                    >
                                                        <Upload className="w-4 h-4 rotate-180" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(file.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
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
