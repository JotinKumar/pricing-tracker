'use client'

import { Pencil, Info, Folder, FolderOpen, MessageSquare } from 'lucide-react'
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
    handleCommentsOpen: (activity: PricingActivity) => void
    handleFilterChange: (field: string, value: string) => void
    isReadOnly: boolean
}

// Clickable filter style
const clickableStyle = "cursor-pointer hover:text-primary hover:underline transition-colors"

export function ActivityRow({
    activity,
    groupBy,
    lookups,
    getDateColor,
    getFirstName,
    handleInlineUpdate,
    handleEdit,
    handleStorageOpen,
    handleCommentsOpen,
    handleFilterChange,
    isReadOnly
}: ActivityRowProps) {
    const [configs, setConfigs] = useState<Record<string, any>>({
        id1: { fieldName: 'ID1', fieldType: 'STRING', prefix: '', hasPrefix: false, isActive: true, displayOnDashboard: true },
        id2: { fieldName: 'ID2', fieldType: 'STRING', prefix: '', hasPrefix: false, isActive: true, displayOnDashboard: true },
        acv: { fieldName: 'ACTUAL', fieldType: '0', prefix: '$' },
        date: { fieldName: 'MM/DD/YYYY' }
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

    // Helper to format the display value for ID1
    const formatId1 = (val: string | null) => {
        if (!val) return ''
        const prefix = configs.id1.hasPrefix ? configs.id1.prefix : ''
        // If val already starts with prefix, don't double it (handle legacy data)
        if (prefix && val.startsWith(prefix)) return val
        return `${prefix}${val}`
    }

    // Helper to format the display value for ID2
    const formatId2 = (val: string | null) => {
        if (!val) return ''
        const prefix = configs.id2.hasPrefix ? configs.id2.prefix : ''
        if (prefix && val.startsWith(prefix)) return val
        return `${prefix}${val}`
    }

    // Helper to render ID display (shows label only if no prefix) - now clickable
    const renderIdDisplay = (id: 'id1' | 'id2', value: string | null) => {
        const config = configs[id]
        // Check if active and should display on dashboard
        if (!config?.isActive || config?.displayOnDashboard === false) return null
        const formatted = id === 'id1' ? formatId1(value) : formatId2(value)
        if (!formatted) return null

        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            if (value) handleFilterChange(id, value)
        }

        // If has prefix, show only the value (prefix is already in formatted)
        // If no prefix, show "Label: value"
        if (config.hasPrefix && config.prefix) {
            return <span className={`font-medium ${clickableStyle}`} onClick={handleClick} title={`Filter by ${id.toUpperCase()}: ${formatted}`}>{formatted}</span>
        }
        return <span className="font-medium">{config.fieldName || id.toUpperCase()}: <span className={clickableStyle} onClick={handleClick} title={`Filter by ${config.fieldName || id.toUpperCase()}`}>{formatted}</span></span>
    }

    // Helper to format ACV based on config
    const formatACV = (value: number | null) => {
        const currency = configs.acv?.prefix || '$'
        if (!value) return `${currency}0`
        const format = configs.acv?.fieldName || 'ACTUAL'

        // Get decimals - use smart defaults if not explicitly set or invalid
        const rawDecimals = parseInt(configs.acv?.fieldType || '')
        const getDefaultDecimals = () => {
            switch (format) {
                case 'THOUSANDS': return 0
                case 'MILLIONS': return 2
                case 'BILLIONS': return 3
                default: return 0
            }
        }
        const decimals = isNaN(rawDecimals) ? getDefaultDecimals() : Math.min(Math.max(rawDecimals, 0), 20)

        switch (format) {
            case 'THOUSANDS':
                return `${currency}${(value / 1000).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}K`
            case 'MILLIONS':
                return `${currency}${(value / 1000000).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}M`
            case 'BILLIONS':
                return `${currency}${(value / 1000000000).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}B`
            default:
                return `${currency}${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
        }
    }

    // Helper to format dates based on config
    const formatDate = (dateValue: string | Date) => {
        const date = new Date(dateValue)
        const format = configs.date?.fieldName || 'MM/DD/YYYY'
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const d = date.getDate().toString().padStart(2, '0')
        const m = (date.getMonth() + 1).toString().padStart(2, '0')
        const y = date.getFullYear()
        const mon = months[date.getMonth()]

        switch (format) {
            case 'DD/MM/YYYY': return `${d}/${m}/${y}`
            case 'YYYY-MM-DD': return `${y}-${m}-${d}`
            case 'DD-Mon-YYYY': return `${d}-${mon}-${y}`
            case 'Mon DD, YYYY': return `${mon} ${d}, ${y}`
            default: return `${m}/${d}/${y}`
        }
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
                        {renderIdDisplay('id1', activity.id1)}
                        {configs.id1?.isActive && configs.id1?.displayOnDashboard !== false &&
                            configs.id2?.isActive && configs.id2?.displayOnDashboard !== false &&
                            activity.id1 && activity.id2 && (
                                <span className="text-muted-foreground/40">/</span>
                            )}
                        {renderIdDisplay('id2', activity.id2)}
                        {((configs.id1?.isActive && configs.id1?.displayOnDashboard !== false && activity.id1) ||
                            (configs.id2?.isActive && configs.id2?.displayOnDashboard !== false && activity.id2)) && (
                                <span className="text-muted-foreground/40">/</span>
                            )}
                        <span className="truncate">
                            {groupBy === 'client' ? (
                                <>Vertical : <span
                                    className={clickableStyle}
                                    onClick={(e) => { e.stopPropagation(); handleFilterChange('verticalId', String(activity.verticalId)) }}
                                    title={`Filter by Vertical: ${activity.vertical?.vertical}`}
                                >{activity.vertical?.vertical}</span></>
                            ) : (
                                <>Client : <span
                                    className={clickableStyle}
                                    onClick={(e) => { e.stopPropagation(); handleFilterChange('clientName', activity.clientName) }}
                                    title={`Filter by Client: ${activity.clientName}`}
                                >{activity.clientName}</span></>
                            )}
                        </span>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3 font-medium text-foreground">{formatACV(activity.annualContractValue)}</td>

            <td className="px-4 py-3">
                <span suppressHydrationWarning className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-bold border ${getDateColor(activity.dueDate)}`}>
                    {formatDate(activity.dueDate)}
                </span>
            </td>

            <td className="px-4 py-3">
                <div className="flex flex-col gap-1 items-start">
                    <span className="text-xs font-semibold text-muted-foreground w-full">
                        V: <span
                            className={`text-foreground ${clickableStyle}`}
                            onClick={(e) => { e.stopPropagation(); if (activity.versionId) handleFilterChange('versionId', String(activity.versionId)) }}
                            title={`Filter by Version: ${activity.version?.version}`}
                        >{activity.version?.version}</span>
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground w-full">
                        C: <span
                            className={`text-foreground ${clickableStyle}`}
                            onClick={(e) => { e.stopPropagation(); if (activity.categoryId) handleFilterChange('categoryId', String(activity.categoryId)) }}
                            title={`Filter by Category: ${activity.category?.category}`}
                        >{activity.category?.category}</span>
                    </span>
                </div>
            </td>

            <td className="px-4 py-3">
                <div className="flex flex-col gap-1 items-start text-xs">
                    {activity.clientLocations?.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                            <span className="text-muted-foreground">CL:</span>
                            {activity.clientLocations.map((l: any, idx: number) => (
                                <span key={l.id}>
                                    <span
                                        className={`font-medium text-foreground ${clickableStyle}`}
                                        onClick={(e) => { e.stopPropagation(); handleFilterChange('clientLocationIds', String(l.id)) }}
                                        title={`Filter by Client Location: ${l.display}`}
                                    >{l.display}</span>
                                    {idx < activity.clientLocations.length - 1 && <span className="text-muted-foreground">, </span>}
                                </span>
                            ))}
                        </div>
                    )}
                    {activity.deliveryLocations?.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                            <span className="text-muted-foreground">DL:</span>
                            {activity.deliveryLocations.map((l: any, idx: number) => (
                                <span key={l.id}>
                                    <span
                                        className={`font-medium text-foreground ${clickableStyle}`}
                                        onClick={(e) => { e.stopPropagation(); handleFilterChange('deliveryLocationIds', String(l.id)) }}
                                        title={`Filter by Delivery Location: ${l.display}`}
                                    >{l.display}</span>
                                    {idx < activity.deliveryLocations.length - 1 && <span className="text-muted-foreground">, </span>}
                                </span>
                            ))}
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
                        onMemberClick={(teamName, userName) => handleFilterChange(`team_${teamName}`, userName)}
                    />
                </div>
            </td>

            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCommentsOpen(activity); }}
                        className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-muted relative"
                        title="Comments"
                    >
                        <MessageSquare className={`h-3.5 w-3.5 ${activity.comments && activity.comments.length > 0 ? "fill-current text-primary" : ""}`} />
                        {(activity.comments?.length || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                                {activity.comments.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleStorageOpen(activity); }}
                        className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-muted relative"
                        title={activity.attachmentCount ? `${activity.attachmentCount} Files` : "Manage Files"}
                    >
                        {activity.attachmentCount && activity.attachmentCount > 0 ? (
                            <FolderOpen className="h-3.5 w-3.5 fill-yellow-400 text-yellow-600" />
                        ) : (
                            <Folder className="h-3.5 w-3.5" />
                        )}
                        {(activity.attachmentCount || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                                {activity.attachmentCount}
                            </span>
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
