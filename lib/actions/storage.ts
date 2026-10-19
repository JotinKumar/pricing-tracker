'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { cwd } from 'process'
import { getSession } from './auth'

const UPLOAD_DIR = join(cwd(), 'storage', 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'zip']

async function ensureUploadDir() {
    try {
        await mkdir(UPLOAD_DIR, { recursive: true })
    } catch {
        // Ignore if exists
    }
}

export async function uploadAttachment(formData: FormData) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const file = formData.get('file') as File
    const fileType = formData.get('fileType') as string
    const id1 = formData.get('id1') as string
    const notes = formData.get('notes') as string | null
    const location = formData.get('location') as string | null

    if (!file || !fileType || !id1) {
        throw new Error('Missing required fields')
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File too large (max 10MB)')
    }

    // Validate file extension
    const extension = (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        throw new Error('File type not allowed')
    }

    await ensureUploadDir()

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename to avoid collisions
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    const storageFileName = `${uniqueSuffix}.${extension}`
    const filePath = join(UPLOAD_DIR, storageFileName)

    // Save file to disk
    await writeFile(filePath, buffer)

    // Save metadata to DB (use session.id, not client-provided userId)
    await prisma.attachment.create({
        data: {
            fileName: file.name,
            fileType: fileType,
            filePath: storageFileName,
            fileSize: file.size,
            id1: id1,
            userId: session.id,
            notes: notes || undefined,
            location: location || undefined
        }
    })

    revalidatePath('/dashboard')
}

export async function updateAttachmentNotes(attachmentId: number, notes: string) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    if (!attachmentId) {
        throw new Error('Missing attachment ID')
    }

    await prisma.attachment.update({
        where: { id: attachmentId },
        data: { notes }
    })

    revalidatePath('/dashboard')
}

export async function getAttachments(id1: string) {
    const session = await getSession()
    if (!session) return []

    const attachments = await prisma.attachment.findMany({
        where: {
            id1: id1
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    avatar: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return attachments
}

export async function deleteAttachment(attachmentId: number) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId }
    })

    if (!attachment) {
        throw new Error('Attachment not found')
    }

    // Only the uploader or an admin can delete
    if (attachment.userId !== session.id && session.role !== 'ADMIN') {
        throw new Error('Forbidden')
    }

    // Delete from disk
    if (attachment.filePath) {
        try {
            const fullPath = join(UPLOAD_DIR, attachment.filePath)
            await unlink(fullPath)
        } catch {
            // Proceed to delete DB record anyway
        }
    }

    await prisma.attachment.delete({
        where: {
            id: attachmentId
        }
    })

    revalidatePath('/dashboard')
}

export async function getDocumentTypes() {
    const session = await getSession()
    if (!session) return []

    try {
        const types = await prisma.documentType.findMany({
            where: { isActive: true },
            orderBy: { type: 'asc' }
        })
        return types.map(t => t.type)
    } catch {
        return []
    }
}
