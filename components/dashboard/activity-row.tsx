'use client'

import { Pencil, Info, Folder, FolderOpen } from 'lucide-react'
import { PricingActivity, Lookups } from '@/types'
import { StatusSelect } from './status-select'
import { DealTeamAvatars } from './deal-team-avatars'
import { getFieldConfigs } from '@/lib/actions/field-config'
import { useState, useEffect } from 'react'

interface ActivityRowProps {
    activity: PricingActivity
    groupBy: 'client' | 'vertical'
    lookups: Lookups
    getDateColor: (dateStr: string | Date) => string
    getFirstName: (fullName: string | null) => string
    handleInlineUpdate: (activity: PricingActivity, field: string, value: string) => Promise<void>
    handleEdit: (activity: PricingActivity) => void
    handleStorageOpen: (activity: PricingActivity) => void
    isReadOnly: boolean
}

export function ActivityRow({
    activity,
    groupBy,
    lookups,
    getDateColor,
    getFirstName,
    handleInlineUpdate,
    handleEdit,
    handleStorageOpen,
    isReadOnly
}: ActivityRowProps) {
    const [configs, setConfigs] = useState<Record<string, any>>({
        id1: { fieldName: 'Salesforce ID', fieldType: 'STRING', prefix: '' }
    })

    useEffect(() => {
        getFieldConfigs().then(res => {
            if (res.success && res.data) {
                const map: any = {}
                res.data.forEach((c: any) => map[c.targetField] = c)
                setConfigs(prev => ({ ...prev, ...map }))
            }
        })
    }, [])

    // Helper to format the display value
    const formatId1 = (val: string | null) => {
        if (!val) return ''
        const prefix = configs.id1.hasPrefix ? configs.id1.prefix : ''
        // If val already starts with prefix, don't double it (handle legacy data)
        if (prefix && val.startsWith(prefix)) return val
        return `${prefix}${val}`
    }

    return (
        <tr className="group transition hover:bg-muted/20">
            {/* Project Name & Configured ID1 & Second Attribute (Client or LOB) */}
            <td className="px-4 py-3 pl-10 font-medium text-foreground border-l-4 border-transparent hover:border-primary transition-all">
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground truncate" title={activity.projectName}>
                        {activity.projectName}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="font-medium">{configs.id1.fieldName}: {formatId1(activity.id1)}</span>
                        <span className="text-muted-foreground/40">/</span>
                        <span className="truncate">
                            {groupBy === 'client' ? `Vertical : ${activity.vertical?.vertical}` : `Client : ${activity.clientName}`}
                        </span>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3 font-medium text-foreground">${activity.annualContractValue?.toLocaleString()}</td>

            <td className="px-4 py-3">
                <span suppressHydrationWarning className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-bold border ${getDateColor(activity.dueDate)}`}>
                    {new Date(activity.dueDate).toLocaleDateString()}
                </span>
            </td>

            <td className="px-4 py-3">
                <div className="flex flex-col gap-1 items-start">
                    <span className="text-xs font-semibold text-muted-foreground w-full">
                        V: <span className="text-foreground">{activity.version?.display || activity.version?.version}</span>
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground w-full">
                        C: <span className="text-foreground">{activity.category?.category}</span>
                    </span>
                </div>
            </td>

            <td className="px-4 py-3">
                <div className="flex flex-col gap-1 items-start text-xs">
                    {activity.clientLocations?.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                            <span className="text-muted-foreground">CL:</span>
                            <span className="font-medium text-foreground">{activity.clientLocations.map((l: any) => l.display).join(', ')}</span>
                        </div>
                    )}
                    {activity.deliveryLocations?.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                            <span className="text-muted-foreground">DL:</span>
                            <span className="font-medium text-foreground">{activity.deliveryLocations.map((l: any) => l.display).join(', ')}</span>
                        </div>
                    )}
                </div>
            </td>

            <td className="px-4 py-3">
                <StatusSelect
                    currentStatusId={activity.status?.id}
                    currentStatusName={activity.status?.status}
                    options={lookups.statuses}
                    onUpdate={(value) => handleInlineUpdate(activity, 'statusId', value)}
                />
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center">
                    <DealTeamAvatars
                        teamMembers={(activity as any).teamMembers}
                    />
                </div>
            </td>

            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleStorageOpen(activity); }}
                        className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-muted"
                        title={activity.attachmentCount ? `${activity.attachmentCount} Files` : "Manage Files"}
                    >
                        {activity.attachmentCount && activity.attachmentCount > 0 ? (
                            <FolderOpen className="h-3.5 w-3.5 fill-yellow-400 text-yellow-600" />
                        ) : (
                            <Folder className="h-3.5 w-3.5" />
                        )}
                    </button>

                    {!isReadOnly && (
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(activity); }} className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-muted">
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    )
}
