'use client'

import { Pencil, Info, Folder, FolderOpen, MessageSquare } from 'lucide-react'
import { PricingActivity, Lookups, FieldConfig } from '@/types'
import { StatusSelect } from './status-select'
import { DealTeamAvatars } from './deal-team-avatars'
import { getFieldConfigs } from '@/lib/actions/field-config'
import { useState, useEffect, useCallback, memo } from 'react'

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

// Default field configurations
const DEFAULT_CONFIGS: Record<string, FieldConfig> = {
    id1: { fieldName: 'ID1', fieldType: 'STRING', prefix: '', hasPrefix: false, isActive: true, displayOnDashboard: true },
    id2: { fieldName: 'ID2', fieldType: 'STRING', prefix: '', hasPrefix: false, isActive: true, displayOnDashboard: true },
    acv: { fieldName: 'ACTUAL', fieldType: '0', prefix: '$' },
    date: { fieldName: 'MM/DD/YYYY' }
}

// Helper functions moved outside component
const formatId1 = (val: string | null, configs: Record<string, FieldConfig>) => {
    if (!val) return ''
    const prefix = configs.id1?.hasPrefix ? configs.id1?.prefix : ''
    if (prefix && val.startsWith(prefix)) return val
    return `${prefix}${val}`
}

const formatId2 = (val: string | null, configs: Record<string, FieldConfig>) => {
    if (!val) return ''
    const prefix = configs.id2?.hasPrefix ? configs.id2?.prefix : ''
    if (prefix && val.startsWith(prefix)) return val
    return `${prefix}${val}`
}

const formatACV = (value: number | null, configs: Record<string, FieldConfig>) => {
    const currency = configs.acv?.prefix || '$'
    if (!value) return `${currency}0`
    const format = configs.acv?.fieldName || 'ACTUAL'
    const decimals = parseInt(configs.acv?.fieldType || '0') || 0
    
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

const formatDate = (dateValue: string | Date, configs: Record<string, FieldConfig>) => {
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

export const ActivityRow = memo(function ActivityRow({
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
    const [configs, setConfigs] = useState<Record<string, FieldConfig>>(DEFAULT_CONFIGS)

    useEffect(() => {
        getFieldConfigs().then(res => {
            if (res.success && res.data) {
                const map: Record<string, FieldConfig> = {}
                res.data.forEach((c: FieldConfig) => map[c.targetField || ''] = c)
                setConfigs(prev => ({ ...prev, ...map }))
            }
        })
    }, [])

    // Memoized handlers
    const handleVerticalFilter = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (activity.verticalId) handleFilterChange('verticalId', String(activity.verticalId))
    }, [activity.verticalId, handleFilterChange])

    const handleClientFilter = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        handleFilterChange('clientName', activity.clientName)
    }, [activity.clientName, handleFilterChange])

    const handleVersionFilter = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (activity.versionId) handleFilterChange('versionId', String(activity.versionId))
    }, [activity.versionId, handleFilterChange])

    const handleCategoryFilter = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (activity.categoryId) handleFilterChange('categoryId', String(activity.categoryId))
    }, [activity.categoryId, handleFilterChange])

    const handleCommentsClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        handleCommentsOpen(activity)
    }, [activity, handleCommentsOpen])

    const handleStorageClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        handleStorageOpen(activity)
    }, [activity, handleStorageOpen])

    const handleEditClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        handleEdit(activity)
    }, [activity, handleEdit])

    const handleStatusUpdate = useCallback(async (value: string) => {
        await handleInlineUpdate(activity, 'statusId', value)
    }, [activity, handleInlineUpdate])

    const handleTeamMemberClick = useCallback((teamName: string, userName: string) => {
        handleFilterChange(`team_${teamName}`, userName)
    }, [handleFilterChange])

    // Helper to render ID display
    const renderIdDisplay = useCallback((id: 'id1' | 'id2', value: string | null) => {
        const config = configs[id]
        if (!config?.isActive || config?.displayOnDashboard === false) return null
        const formatted = id === 'id1' ? formatId1(value, configs) : formatId2(value, configs)
        if (!formatted) return null

        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            if (value) handleFilterChange(id, value)
        }

        if (config.hasPrefix && config.prefix) {
            return <span className={`font-medium ${clickableStyle}`} onClick={handleClick} title={`Filter by ${id.toUpperCase()}: ${formatted}`}>{formatted}</span>
        }
        return <span className="font-medium">{config.fieldName || id.toUpperCase()}: <span className={clickableStyle} onClick={handleClick} title={`Filter by ${config.fieldName || id.toUpperCase()}`}>{formatted}</span></span>
    }, [configs, handleFilterChange])

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
                                    onClick={handleVerticalFilter}
                                    title={`Filter by Vertical: ${activity.vertical?.vertical}`}
                                >{activity.vertical?.vertical}</span></>
                            ) : (
                                <>Client : <span
                                    className={clickableStyle}
                                    onClick={handleClientFilter}
                                    title={`Filter by Client: ${activity.clientName}`}
                                >{activity.clientName}</span></>
                            )}
                        </span>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3 font-medium text-foreground">{formatACV(activity.annualContractValue, configs)}</td>

            <td className="px-4 py-3">
                <span suppressHydrationWarning className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-bold border ${getDateColor(activity.dueDate)}`}>
                    {formatDate(activity.dueDate, configs)}
                </span>
            </td>

            <td className="px-4 py-3">
                <div className="flex flex-col gap-1 items-start">
                    <span className="text-xs font-semibold text-muted-foreground w-full">
                        V: <span
                            className={`text-foreground ${clickableStyle}`}
                            onClick={handleVersionFilter}
                            title={`Filter by Version: ${activity.version?.version}`}
                        >{activity.version?.version}</span>
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground w-full">
                        C: <span
                            className={`text-foreground ${clickableStyle}`}
                            onClick={handleCategoryFilter}
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
                            {activity.clientLocations.map((l, idx: number) => (
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
                            {activity.deliveryLocations.map((l, idx: number) => (
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
                    onUpdate={handleStatusUpdate}
                />
            </td>

            <td className="px-4 py-3">
                <div className="flex items-center">
                    <DealTeamAvatars
                        teamMembers={activity.teamMembers}
                        onMemberClick={handleTeamMemberClick}
                    />
                </div>
            </td>

            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={handleCommentsClick}
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
                        onClick={handleStorageClick}
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
                        <button onClick={handleEditClick} className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-muted">
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    )
})
