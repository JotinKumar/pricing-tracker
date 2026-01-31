'use client'

import { useState } from 'react'
import { Upload, Plus, FileText, Image as ImageIcon, FileSpreadsheet, FileIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Attachment } from '@prisma/client'
import { FileItemRow } from '@/components/storage/file-item-row'
import { useStorage } from '@/hooks/use-storage'
import { uploadAttachment } from '@/lib/actions/storage'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FileStorageSectionProps {
    activity: any
    currentUserId: number
    currentUserRole: string
}

export function FileStorageSection({ activity, currentUserId, currentUserRole }: FileStorageSectionProps) {
    const {
        attachments,
        isLoading,
        uploading,
        setUploading,
        uploadProgress,
        setUploadProgress,
        handleDelete,
        handleUploadComplete,
        handleUpdateNote
    } = useStorage(activity?.id)

    const [selectedType, setSelectedType] = useState<string>('OTHER')

    const hasWriteAccess = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER' || (activity && activity.reps.some((rep: any) => rep.id === currentUserId))

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !activity) return

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB')
            return
        }

        setUploading(true)
        setUploadProgress(10) // Fake start progress

        const formData = new FormData()
        formData.append('file', file)
        formData.append('activityId', activity.id.toString())
        formData.append('fileType', selectedType)
        formData.append('userId', currentUserId.toString())

        try {
            // Simulate progress
            const interval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90))
            }, 200)

            await uploadAttachment(formData)

            clearInterval(interval)
            setUploadProgress(100)
            toast.success('File uploaded successfully')
            // handleUploadComplete(res.data) - requires return value or separate fetch. 
            // Triggering refresh via useStorage's attachments update is complex without return.
            // For now, assuming user will refresh or we add refresh to useStorage.
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('An error occurred during upload')
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-background rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-sm">Attachments & Files</h3>
                    <p className="text-xs text-muted-foreground">Manage documents for this activity</p>
                </div>

                {hasWriteAccess && (
                    <div className="flex items-center gap-2">
                        <Select value={selectedType} onValueChange={(v) => setSelectedType(v)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue placeholder="File Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CONTRACT"><div className="flex items-center gap-2"><FileText className="w-3 h-3" /> Contract</div></SelectItem>
                                <SelectItem value="P_AND_L"><div className="flex items-center gap-2"><FileSpreadsheet className="w-3 h-3" /> P&L</div></SelectItem>
                                <SelectItem value="IMAGE"><div className="flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Image</div></SelectItem>
                                <SelectItem value="OTHER"><div className="flex items-center gap-2"><FileIcon className="w-3 h-3" /> Other</div></SelectItem>
                            </SelectContent>
                        </Select>

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
                                className="h-8 text-xs gap-1.5"
                                disabled={uploading}
                                asChild
                            >
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </label>
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : attachments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5">
                        <Upload className="w-8 h-8 mb-3 opacity-50" />
                        <p className="text-sm font-medium">No files uploaded yet</p>
                        <p className="text-xs">Upload documents relevant to this activity</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {attachments.map((file: any) => (
                            <FileItemRow
                                key={file.id}
                                file={file}
                                currentUserId={currentUserId}
                                currentUserRole={currentUserRole}
                                onDelete={handleDelete}
                                onUpdateNote={handleUpdateNote}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
