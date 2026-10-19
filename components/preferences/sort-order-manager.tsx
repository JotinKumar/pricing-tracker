'use client'

import { useState, useEffect } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SortableItemProps {
    id: string | number
    label: string
}

function SortableItem({ id, label }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' as const : 'static' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn(
            "flex items-center gap-3 p-2 rounded-md border border-border bg-card mb-2 shadow-sm transition-all select-none",
            isDragging && "shadow-lg scale-[1.02] bg-accent rotate-1"
        )}>
            <button {...attributes} {...listeners} className="p-1.5 text-muted-foreground/50 hover:text-foreground cursor-grab active:cursor-grabbing rounded hover:bg-muted">
                <GripVertical className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium pr-4">{label}</span>
        </div>
    );
}

interface SortOrderManagerProps {
    items: { id: number; name: string }[]
    onOrderChange: (newOrderIds: number[]) => void
}

export function SortOrderManager({ items, onOrderChange }: SortOrderManagerProps) {
    const [localItems, setLocalItems] = useState(items)

    useEffect(() => {
        setLocalItems(items)
    }, [items])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLocalItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                // Notify parent immediately or deferred? 
                // Parent expects IDs.
                onOrderChange(newOrder.map(i => i.id));
                return newOrder;
            });
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="max-h-[300px] overflow-y-auto p-1">
                <SortableContext
                    items={localItems.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {localItems.map((item) => (
                        <SortableItem key={item.id} id={item.id} label={item.name} />
                    ))}
                </SortableContext>
                {localItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs italic">
                        No items found to sort.
                    </div>
                )}
            </div>
        </DndContext>
    )
}
