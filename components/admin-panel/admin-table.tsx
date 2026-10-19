'use client'

import { Pencil, Check, X, Plus, GripVertical } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
import { AdminDataItem } from '@/types';

export interface AdminTableRow {
    id: number
    name?: string | null
    shortName?: string | null
    initials?: string | null
    email?: string | null
    display?: string | null
    role?: string
    designation?: string
    currency?: string
    isActive?: boolean
    manager?: { id: number; name: string; initials?: string } | null
    teams?: { id: number; teamname: string }[]
    [key: string]: unknown
}

interface AdminTableProps {
    activeTab: string
    data: AdminDataItem[]
    loading: boolean
    handleEdit: (item: AdminDataItem) => void
    handleCreate: () => void
    handleReorder?: (items: AdminDataItem[]) => void
    fields: { key: string; label: string }
}

function SortableRow({ item, activeTab, fields, handleEdit }: { item: AdminTableRow; activeTab: string; fields: { key: string; label: string }; handleEdit: (i: AdminTableRow) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' as const : 'static' as const,
    };

    return (
        <tr ref={setNodeRef} style={style} className={cn("hover:bg-muted/50 transition-colors duration-200 group border-b border-border/30 last:border-0 cursor-default", isDragging && "bg-muted shadow-md")}>
            {/* Drag Handle */}
            {activeTab !== 'User' && (
                <td className="px-1 py-3 w-[40px] text-center">
                    <button {...attributes} {...listeners} className="p-1 text-muted-foreground/30 hover:text-foreground cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4" />
                    </button>
                </td>
            )}

            <td className="px-3 py-3 text-muted-foreground font-mono text-xs text-center opacity-60">#{item.id}</td>

            {activeTab === 'User' && (
                <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-background shadow-sm shrink-0">
                            {item.initials || item.shortName || (item.name ? item.name.substring(0, 2).toUpperCase() : '??')}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate opacity-80">{item.email}</span>
                        </div>
                    </div>
                </td>
            )}

            {/* Primary Key Output */}
            {activeTab !== 'User' && (
                <td className={cn("px-3 py-3 font-medium text-foreground", (activeTab === 'SalesforceStage' || activeTab === 'Subvertical') ? "w-[35%]" : "w-[60%]")}>{item[fields.key] as string | number}</td>
            )}

            {/* Description Output */}
            {activeTab === 'SalesforceStage' && (
                <td className="px-3 py-3 text-muted-foreground w-[40%]">{item.description as string | number || '-'}</td>
            )}

            {/* Display Output */}
            {activeTab !== 'User' && (
                <td className="px-3 py-3 text-muted-foreground">
                    {item.display ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border/50 font-mono">
                            {item.display}
                        </span>
                    ) : '-'}
                </td>
            )}

            {/* Initials Column */}
            {activeTab === 'User' && <td className="px-3 py-3 text-muted-foreground font-mono text-xs">{item.initials || '-'}</td>}

            {/* Manager Avatar */}
            {activeTab === 'User' && (
                <td className="px-3 py-3">
                    {item.manager ? (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground border border-background shadow-sm" title={item.manager.name}>
                            {item.manager.initials || item.manager.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                    ) : (
                        <span className="text-muted-foreground/30 text-xs">-</span>
                    )}
                </td>
            )}

            {/* Role Badges */}
            {activeTab === 'User' && (
                <td className="px-3 py-3">
                    <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide border",
                        item.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                            item.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    )}>
                        {item.role}
                    </span>
                </td>
            )}

            {/* Stacked Designation / Teams */}
            {activeTab === 'User' && (
                <td className="px-3 py-3">
                    <div className="flex flex-col gap-1 items-start">
                        {item.designation && (
                            <span className="text-[10px] font-semibold text-foreground/90">
                                {item.designation}
                            </span>
                        )}
                        {item.teams && item.teams.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {item.teams.map((t) => (
                                    <span key={t.id} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border/50">
                                        {t.teamname}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-muted-foreground/30 text-[10px]">-</span>
                        )}
                    </div>
                </td>
            )}

            {/* Location Currency */}
            {activeTab === 'Location' && (
                <td className="px-3 py-3 text-muted-foreground font-mono text-xs">
                    {item.currency || '-'}
                </td>
            )}

            {/* Parent Vertical for Subvertical */}
            {activeTab === 'Subvertical' && (
                <td className="px-3 py-3 text-muted-foreground">
                    {(item as { vertical?: { vertical?: string } }).vertical?.vertical || '-'}
                </td>
            )}

            <td className="px-3 py-3 text-center">
                <div className="flex justify-center">
                    {item.isActive ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-semibold border border-emerald-500/20">
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 text-[9px] font-semibold border border-red-500/20">
                            <span className="w-1 h-1 rounded-full bg-red-500"></span>
                            Inactive
                        </span>
                    )}
                </div>
            </td>
            <td className="px-3 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleEdit(item)}
                        aria-label="Edit"
                        className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all active:scale-95 cursor-pointer"
                    >
                        <Pencil className="w-3 h-3" />
                    </button>
                </div>
            </td>
        </tr>
    )
}

export function AdminTable({ activeTab, data, loading, handleEdit, handleCreate, handleReorder, fields }: AdminTableProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = data.findIndex((item) => item.id === active.id);
            const newIndex = data.findIndex((item) => item.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && handleReorder) {
                const newOrder = arrayMove(data, oldIndex, newIndex);
                handleReorder(newOrder);
            }
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-auto relative">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider sticky top-0 z-20 bg-muted/40 backdrop-blur-md border-b border-border/40 shadow-sm">
                            <tr>
                                {activeTab !== 'User' && <th className="px-1 py-3 w-[40px] text-center"></th>}
                                <th className="px-3 py-3 w-[8%] text-center">#</th>
                                {activeTab === 'User' && <th className="px-3 py-3 w-[30%]">User</th>}

                                {/* Primary Key Column */}
                                {activeTab !== 'User' && (
                                    <th className={cn("px-3 py-3 font-semibold text-foreground", (activeTab === 'SalesforceStage' || activeTab === 'Subvertical') ? "w-[35%]" : "w-[60%]")}>{fields.label}</th>
                                )}

                                {/* Description Column for SalesforceStage */}
                                {activeTab === 'SalesforceStage' && <th className="px-3 py-3 w-[40%]">Description</th>}

                                {/* Display Column for Lookups */}
                                {activeTab !== 'User' && <th className="px-3 py-3 w-[16%]">Display</th>}

                                {activeTab === 'User' && <th className="px-3 py-3 w-[8%]">Initials</th>}
                                {activeTab === 'User' && <th className="px-3 py-3 w-[8%]">Manager</th>}
                                {activeTab === 'User' && <th className="px-3 py-3 w-[10%]">Role</th>}
                                {activeTab === 'User' && <th className="px-3 py-3 w-[20%]">Designation / Teams</th>}
                                {activeTab === 'Location' && <th className="px-3 py-3 w-[10%]">Currency</th>}
                                {activeTab === 'Subvertical' && <th className="px-3 py-3 w-[25%]">Vertical</th>}

                                <th className="px-3 py-3 text-center w-[8%] hidden md:table-cell">Status</th>
                                <th className="px-3 py-3 text-right w-[8%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="">
                            {loading ? (
                                <tr><td colSpan={activeTab === 'User' ? 8 : (activeTab === 'SalesforceStage' || activeTab === 'Subvertical') ? 10 : 9} className="px-6 py-12 text-center text-muted-foreground animate-pulse">Loading data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={activeTab === 'User' ? 8 : (activeTab === 'SalesforceStage' || activeTab === 'Subvertical') ? 10 : 9} className="px-6 py-12 text-center text-muted-foreground italic">No records found.</td></tr>
                            ) : (
                                <SortableContext
                                    items={data.map(d => d.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {data.map((item) => (
                                        <SortableRow key={item.id} item={item as AdminTableRow} activeTab={activeTab} fields={fields} handleEdit={handleEdit} />
                                    ))}
                                </SortableContext>
                            )}
                        </tbody>
                    </table>
                </DndContext>
            </div>
        </div>
    )
}