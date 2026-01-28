'use client'

import { Button } from '@/components/ui/button'
import { ActivityFormValues } from '@/lib/schemas'

interface VersionConfirmModalProps {
    isOpen: boolean
    pendingData: ActivityFormValues | null
    onConfirmSaveAsNew: () => void
    onConfirmUpdate: () => void
    onCancel: () => void
}

export function VersionConfirmModal({
    isOpen,
    pendingData,
    onConfirmSaveAsNew,
    onConfirmUpdate,
    onCancel
}: VersionConfirmModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-6 ring-1 ring-border space-y-4">
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">Version Change Detected</h3>
                    <p className="text-sm text-muted-foreground">
                        You have changed the version of this activity. Do you want to save this as a new activity or update the existing one?
                    </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                    <Button
                        onClick={onConfirmSaveAsNew}
                        disabled={!pendingData}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                        Save as New Activity
                    </Button>
                    <Button
                        onClick={onConfirmUpdate}
                        disabled={!pendingData}
                        variant="outline"
                        className="w-full"
                    >
                        Update Existing Activity
                    </Button>
                    <Button
                        onClick={onCancel}
                        variant="ghost"
                        className="w-full text-muted-foreground"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    )
}
