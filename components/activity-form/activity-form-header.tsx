'use client'

interface ActivityFormHeaderProps {
    isEdit: boolean
    onClose: () => void
}

export function ActivityFormHeader({ isEdit, onClose }: ActivityFormHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-foreground">
                {isEdit ? 'Edit Activity' : 'New Pricing Activity'}
            </h2>
            <button 
                type="button" 
                onClick={onClose} 
                className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-muted/80"
            >
                ✕
            </button>
        </div>
    )
}
