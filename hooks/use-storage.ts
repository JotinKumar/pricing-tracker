import { useState, useEffect } from 'react'
import { Attachment } from '@prisma/client'
import { toast } from 'sonner'
import { getAttachments, deleteAttachment } from '@/lib/actions/storage'

export function useStorage(activityId: number | undefined) {
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const fetchAttachments = async () => {
        if (!activityId) return
        try {
            setIsLoading(true)
            const data = await getAttachments(activityId.toString())
            if (data) {
                setAttachments(data)
            }
        } catch (error) {
            console.error('Failed to load attachments:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAttachments()
    }, [activityId])

    const handleDelete = async (fileId: number) => {
        try {
            await deleteAttachment(fileId)
            toast.success('File deleted successfully')
            setAttachments(prev => prev.filter(a => a.id !== fileId))
        } catch (error) {
            toast.error('An error occurred while deleting the file')
        }
    }

    const handleUploadComplete = (newAttachment: Attachment) => {
        setAttachments(prev => [newAttachment, ...prev])
        setUploading(false)
        setUploadProgress(0)
    }

    const handleUpdateNote = (fileId: number, newNote: string) => {
        setAttachments(prev => prev.map(a =>
            a.id === fileId ? { ...a, notes: newNote } : a
        ))
    }

    return {
        attachments,
        isLoading,
        uploading,
        setUploading,
        uploadProgress,
        setUploadProgress,
        handleDelete,
        handleUploadComplete,
        handleUpdateNote,
        refreshAttachments: fetchAttachments
    }
}
