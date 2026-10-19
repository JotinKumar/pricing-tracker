import { useState, useEffect } from 'react'
import { Attachment } from '@prisma/client'
import { toast } from 'sonner'
import { getAttachments, deleteAttachment, getDocumentTypes } from '@/lib/actions/storage'

type AttachmentWithUser = Attachment & { user?: { name: string | null; email: string; avatar: string | null } }

export function useStorage(id1: string | undefined) {
    const [attachments, setAttachments] = useState<AttachmentWithUser[]>([])
    const [documentTypes, setDocumentTypes] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const fetchAttachments = async () => {
        // Fetch types regardless of activity
        try {
            const types = await getDocumentTypes()
            setDocumentTypes(types)
        } catch (error) {
            console.error('Failed to load document types:', error)
        }

        if (!id1) return
        try {
            setIsLoading(true)
            const data = await getAttachments(id1)
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
    }, [id1])

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
        documentTypes,
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
