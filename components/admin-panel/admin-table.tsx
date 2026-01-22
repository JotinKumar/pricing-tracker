'use client'

import { Pencil, Check, X, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AdminTableProps {
    activeTab: string
    data: any[]
    loading: boolean
    handleEdit: (item: any) => void
    handleCreate: () => void
    fields: { key: string; label: string }
}

export function AdminTable({ activeTab, data, loading, handleEdit, handleCreate, fields }: AdminTableProps) {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-auto relative">
                <table className="w-full text-sm text-left border-collapse table-fixed">
                    <thead className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider sticky top-0 z-20 bg-muted/40 backdrop-blur-md border-b border-border/40 shadow-sm">
                        <tr>
                            <th className="px-3 py-3 w-[8%] text-center">#</th>
                            {activeTab === 'User' && <th className="px-3 py-3 w-[30%]">User</th>}

                            {/* Primary Key Column */}
                            {activeTab !== 'User' && (
                                <th className="px-3 py-3 font-semibold text-foreground w-[60%]">{fields.label}</th>
                            )}

                            {/* Display Column for Lookups */}
                            {activeTab !== 'User' && <th className="px-3 py-3 w-[16%]">Display</th>}

                            {activeTab === 'User' && <th className="px-3 py-3 w-[8%]">Initials</th>}
                            {activeTab === 'User' && <th className="px-3 py-3 w-[8%]">Manager</th>}
                            {activeTab === 'User' && <th className="px-3 py-3 w-[10%]">Role</th>}
                            {activeTab === 'User' && <th className="px-3 py-3 w-[20%]">Designation / Teams</th>}

                            <th className="px-3 py-3 text-center w-[8%] hidden md:table-cell">Status</th>
                            <th className="px-3 py-3 text-right w-[8%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="">
                        {loading ? (
                            <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground animate-pulse">Loading data...</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic">No records found.</td></tr>
                        ) : (
                            data.map((item: any) => (
                                <tr key={item.id} className="hover:bg-muted/50 transition-colors duration-200 group border-b border-border/30 last:border-0 cursor-default">
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
                                        <td className="px-3 py-3 font-medium text-foreground">{item[fields.key]}</td>
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
                                                {item.teams?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.teams.map((t: any) => (
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}