'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { cwd } from 'process'

const UPLOAD_DIR = join(cwd(), 'storage', 'uploads')

async function ensureUploadDir() {
    try {
        await mkdir(UPLOAD_DIR, { recursive: true })
    } catch (error) {
        // Ignore if exists
    }
}

export async function uploadAttachment(formData: FormData) {
    const file = formData.get('file') as File
    const fileType = formData.get('fileType') as string
    const salesForceId = formData.get('salesForceId') as string
    const userId = parseInt(formData.get('userId') as string)

    if (!file || !fileType || !salesForceId || !userId) {
        throw new Error('Missing required fields')
    }

    await ensureUploadDir()

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename to avoid collisions
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    const originalName = file.name
    const extension = originalName.split('.').pop()
    const storageFileName = `${uniqueSuffix}.${extension}`
    const filePath = join(UPLOAD_DIR, storageFileName)

    // Save file to disk
    await writeFile(filePath, buffer)

    // Save metadata to DB
    await prisma.attachment.create({
        data: {
            fileName: originalName,
            fileType: fileType,
            filePath: storageFileName, // Store relative filename/path
            fileSize: file.size,
            salesForceId: salesForceId,
            userId: userId
        }
    })

    revalidatePath('/dashboard')
}

export async function addNote(salesForceId: string, userId: number, noteContent: string) {
    if (!noteContent || !salesForceId || !userId) {
        throw new Error('Missing required fields')
    }

    await prisma.attachment.create({
        data: {
            fileName: 'Note',
            fileType: 'Note',
            salesForceId: salesForceId,
            userId: userId,
            notes: noteContent
        }
    })

    revalidatePath('/dashboard')
}

export async function getAttachments(salesForceId: string) {
    const attachments = await prisma.attachment.findMany({
        where: {
            salesForceId: salesForceId
        },
        include: {
            user: {
                select: {
                    name: true
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
    const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId }
    })

    if (!attachment) {
        throw new Error('Attachment not found')
    }

    // Delete from disk
    if (attachment.filePath) {
        try {
            const fullPath = join(UPLOAD_DIR, attachment.filePath)
            await unlink(fullPath)
        } catch (error) {
            console.error('Failed to delete file from disk', error)
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
    try {
        const types = await prisma.documentType.findMany({
            where: { isActive: true },
            orderBy: { type: 'asc' }
        })
        return types.map(t => t.type)
    } catch (error) {
        console.error('Failed to fetch document types', error)
        return []
    }
}
