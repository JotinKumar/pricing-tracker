// Refresh types
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { cwd } from 'process'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const attachmentId = parseInt(id)

        if (isNaN(attachmentId)) {
            return new NextResponse('Invalid ID', { status: 400 })
        }

        // @ts-ignore
        const attachment = await prisma.attachment.findUnique({
            where: { id: attachmentId }
        })

        if (!attachment) {
            return new NextResponse('Attachment not found', { status: 404 })
        }

        if (!attachment.filePath) {
            return new NextResponse('File path missing', { status: 404 })
        }

        const filePath = join(cwd(), 'storage', 'uploads', attachment.filePath)

        try {
            const fileBuffer = await readFile(filePath)

            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
                    'Content-Type': attachment.fileType || 'application/octet-stream',
                    'Content-Length': (attachment.fileSize || 0).toString(),
                },
            })
        } catch (error) {
            console.error('File read error:', error)
            return new NextResponse('File not found on server', { status: 404 })
        }
    } catch (error) {
        console.error('API error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
