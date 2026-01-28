'use client'

import { FileStorageSection } from '@/components/activity-form/file-storage-section'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { PricingActivity } from '@/types'
import { ActivityRefDisplay } from './activity-ref-display'

interface StorageModalProps {
    isOpen: boolean
    onClose: () => void
    activity: PricingActivity | null
    currentUserId: number
    currentUserRole?: string
}

export function StorageModal({ isOpen, onClose, activity, currentUserId, currentUserRole }: StorageModalProps) {
    if (!activity || !isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden ring-1 ring-border max-h-[85vh] flex flex-col">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="font-bold text-foreground flex items-center">
                        Project Files - {activity.projectName}
                        <ActivityRefDisplay activity={activity} className="ml-2 font-normal text-muted-foreground" />
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <FileStorageSection
                        activity={activity}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                    />
                </div>
            </div>
        </div>
    )
}
