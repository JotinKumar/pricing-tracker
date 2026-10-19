'use client'

import { useState } from 'react'
import { Upload, Plus, FileText, Image as ImageIcon, FileSpreadsheet, FileIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Attachment } from '@prisma/client'
import { FileItemRow } from '@/components/storage/file-item-row'
import { useStorage } from '@/hooks/use-storage'
import { uploadAttachment } from '@/lib/actions/storage'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { PricingActivity } from '@/types'

interface FileStorageSectionProps {
    activity: (PricingActivity & { reps?: { id: number }[] }) | null
    currentUserId: number
    currentUserRole: string
    className?: string
}

export function FileStorageSection({ activity, currentUserId, currentUserRole, className }: FileStorageSectionProps) {
    const {
        attachments,
        documentTypes,
        isLoading,
        uploading,
        setUploading,
        uploadProgress,
        setUploadProgress,
        handleDelete,
        handleUploadComplete,
        handleUpdateNote,
        refreshAttachments
    } = useStorage(activity?.id1 || activity?.id?.toString())

    const [selectedType, setSelectedType] = useState<string>('')
    const [notes, setNotes] = useState('')
    const [location, setLocation] = useState('') // Keep manual location if needed, but input is now file trigger? 
    // User requested "Text box... makes it clickable... opens file browser". 
    // This implies the input displays the filename. 
    // Location field might need to move or be removed if it conflicts. 
    // I'll keep 'location' state but use the input for file display for now as per "clickable" instruction.
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const hasWriteAccess = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER' || (activity && activity.reps!.some((rep) => rep.id === currentUserId))

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            // Pre-fill location/notes or just show filename? 
            // Input value will be controlled to show filename.
        }
    }

    const handleUploadClick = async () => {
        if (!selectedFile || !activity) return

        if (!selectedType) {
            toast.error('Please select a File Type first')
            return
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB')
            return
        }

        setUploading(true)
        setUploadProgress(10)

        const formData = new FormData()
        formData.append('file', selectedFile)
        // Use id1 as Salesforce ID if available, fallback to id
        formData.append('id1', activity.id1 || activity.id.toString())
        formData.append('fileType', selectedType)
        formData.append('notes', notes)
        formData.append('location', location)

        try {
            // Simulate progress
            const interval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90))
            }, 200)

            await uploadAttachment(formData)

            clearInterval(interval)
            setUploadProgress(100)
            toast.success('File uploaded successfully')
            setNotes('')
            setLocation('')
            setSelectedFile(null)
            setSelectedType('') // Reset type

            setUploading(false)
            refreshAttachments()
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('An error occurred during upload')
            setUploading(false)
        }
    }

    return (
        <div className={cn("space-y-4 pt-4 border-t border-border", className)}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Attachments & Files</h3>

            {hasWriteAccess && (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Select value={selectedType} onValueChange={(v) => setSelectedType(v)}>
                            <SelectTrigger className="w-[300px] h-9 text-xs">
                                <SelectValue placeholder="File Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {documentTypes.length > 0 ? (
                                    documentTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            <div className="flex items-center gap-2">
                                                {type === 'CONTRACT' ? <FileText className="w-3 h-3" /> :
                                                    type === 'P_AND_L' ? <FileSpreadsheet className="w-3 h-3" /> :
                                                        type === 'IMAGE' ? <ImageIcon className="w-3 h-3" /> :
                                                            <FileIcon className="w-3 h-3" />}
                                                {type}
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="OTHER">
                                        <div className="flex items-center gap-2">
                                            <FileIcon className="w-3 h-3" /> Other
                                        </div>
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>

                        {/* Clickable File Selection Input */}
                        <div className="flex-1 relative cursor-pointer group">
                            <Input
                                readOnly
                                placeholder="Click to select file..."
                                value={selectedFile ? selectedFile.name : ''}
                                onClick={() => document.getElementById('file-upload')?.click()}
                                className="h-9 text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                            </div>
                        </div>

                        <div className="relative">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                onChange={handleFileSelect}
                                disabled={uploading}
                            />
                            <Button
                                size="sm"
                                variant="default"
                                className="h-9 text-xs gap-1.5 min-w-[100px]"
                                disabled={uploading || !selectedFile}
                                onClick={handleUploadClick}
                            >
                                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                {uploading ? 'Uploading...' : 'Upload File'}
                            </Button>
                        </div>
                    </div>
                    <Textarea
                        placeholder="Add detailed notes (optional)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[60px] resize-none text-sm"
                    />
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-10 w-full border border-input rounded-md bg-background/50">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : attachments.length > 0 ? (
                <div className="w-full rounded-md border border-input bg-background/50 overflow-hidden">
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-border">
                            {attachments.map((file) => (
                                <FileItemRow
                                    key={file.id}
                                    file={file}
                                    currentUserId={currentUserId}
                                    currentUserRole={currentUserRole}
                                    onDelete={handleDelete}
                                    onUpdateNote={handleUpdateNote}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border border-input rounded-md border-dashed bg-muted/10">
                    No files uploaded yet
                </div>
            )}
        </div>
    )
}
