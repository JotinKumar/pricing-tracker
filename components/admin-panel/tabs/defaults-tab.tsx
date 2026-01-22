'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast-custom'
import { getDefaults, saveDefault, deleteDefault } from '@/lib/actions/defaults'
import { getAdminData } from '@/lib/actions/admin'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export function DefaultsTab() {
    const { addToast } = useToast()
    
    // State
    const [defaultsList, setDefaultsList] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [defaultType, setDefaultType] = useState<string>('')
    const [defaultRefId, setDefaultRefId] = useState<string>('')
    const [defaultUserId, setDefaultUserId] = useState<string>('')
    const [defaultOptions, setDefaultOptions] = useState<any[]>([])
    
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Initial Data Fetch
    useEffect(() => {
        loadDefaults()
        loadUsers()
    }, [])

    const loadDefaults = async () => {
        const res = await getDefaults()
        if (res.success) setDefaultsList(res.data || [])
    }

    const loadUsers = async () => {
        const res = await getAdminData('User')
        if (res.success) setUsers(res.data || [])
    }

    const handleDefaultTypeChange = async (val: string) => {
        setDefaultType(val)
        setDefaultRefId('')
        // Map UI types to Backend Data types
        let typeToFetch = val
        if (val === 'Client Location' || val === 'Delivery Location') {
            typeToFetch = 'Location'
        }

        const res = await getAdminData(typeToFetch as any)
        if (res.success) setDefaultOptions(res.data || [])
    }

    const handleCreateDefault = async () => {
        if (!defaultType || !defaultUserId) {
            addToast({ type: 'error', title: 'Missing Fields', message: 'Please select Type and User' })
            return
        }
        const res = await saveDefault({
            type: defaultType,
            referenceId: (defaultRefId === '0' || !defaultRefId) ? null : defaultRefId,
            userId: parseInt(defaultUserId)
        })
        if (res.success) {
            loadDefaults()
            addToast({ type: 'success', title: 'Rule Added', message: 'Default assignment created' })
            setDefaultUserId('')
        } else {
            addToast({ type: 'error', title: 'Error', message: res.message || 'Failed to save rule' })
        }
    }

    const handleDeleteDefault = async (id: number) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Rule',
            message: 'Are you sure you want to delete this default assignment rule?',
            onConfirm: async () => {
                const res = await deleteDefault(id)
                if (res.success) {
                    loadDefaults()
                    addToast({ type: 'success', title: 'Deleted', message: 'Rule deleted' })
                } else {
                    addToast({ type: 'error', title: 'Error', message: res.message })
                }
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            }
        })
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex-none">
                <h3 className="text-lg font-bold">Default User Assignments</h3>
                <p className="text-sm text-muted-foreground">Configure auto-assignment rules based on criteria.</p>
            </div>

            <div className="space-y-4 bg-muted/30 p-6 rounded-lg flex-none">
                <div className="grid grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Criteria Type</Label>
                        <Select value={defaultType} onValueChange={handleDefaultTypeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Vertical">Vertical</SelectItem>
                                <SelectItem value="Horizontal">Horizontal</SelectItem>
                                <SelectItem value="Client Location">Client Location</SelectItem>
                                <SelectItem value="Delivery Location">Delivery Location</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Specific Item (Default: All)</Label>
                        <Select value={defaultRefId} onValueChange={setDefaultRefId} disabled={!defaultType}>
                            <SelectTrigger>
                                <SelectValue placeholder="All (Default)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">All</SelectItem>
                                {defaultOptions.map(opt => (
                                    <SelectItem key={opt.id} value={String(opt.id)}>
                                        {opt.name || opt.vertical || opt.horizontal || opt.country}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Assign User</Label>
                        <Select value={defaultUserId} onValueChange={setDefaultUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select User" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleCreateDefault}>
                        <Plus className="w-4 h-4 mr-2" /> Add Rule
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-md bg-card border border-border">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs font-semibold text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 p-2">
                        <tr>
                            <th className="px-6 py-3">Criteria Type</th>
                            <th className="px-6 py-3">Specific Item</th>
                            <th className="px-6 py-3">Assigned User</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {defaultsList.map(rule => (
                            <tr key={rule.id} className="hover:bg-muted/30">
                                <td className="px-6 py-3 font-medium">{rule.type}</td>
                                <td className="px-6 py-3">
                                    {rule.referenceId ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium border border-blue-200/20">
                                            {rule.referenceName || `ID: ${rule.referenceId}`}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium border border-emerald-200/20">
                                            All
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {rule.user?.shortName || rule.user?.name?.substring(0, 2) || '??'}
                                        </div>
                                        <span>{rule.user?.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button
                                        onClick={() => handleDeleteDefault(rule.id)}
                                        className="text-muted-foreground hover:text-red-500 p-1 transition-colors"
                                        aria-label="Delete rule"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {defaultsList.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">No default assignment rules configured.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmationDialog
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    )
}
