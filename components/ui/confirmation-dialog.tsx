'use client'

import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmationDialogProps {
    isOpen: boolean
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
    onCancel: () => void
    variant?: 'default' | 'destructive' | 'warning'
}

export function ConfirmationDialog({
    isOpen,
    title = 'Confirm Action',
    message,
    confirmLabel = 'Proceed',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'warning'
}: ConfirmationDialogProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card shadow-2xl rounded-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 ring-4 ring-amber-500/5">
                        <AlertTriangle className="h-6 w-6" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-foreground">{title}</h3>
                        <p className="text-sm text-muted-foreground">{message}</p>
                    </div>

                    <div className="flex gap-3 w-full mt-2">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1"
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
