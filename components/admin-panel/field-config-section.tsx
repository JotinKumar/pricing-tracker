'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { getFieldConfigs, saveFieldConfig } from '@/lib/actions/field-config'
import { toast } from 'sonner'
import { Plus, Minus } from 'lucide-react'

interface FieldConfig {
    targetField: string
    fieldName: string
    fieldType: string
    hasPrefix: boolean
    prefix?: string
    isActive: boolean
    displayOnDashboard: boolean
}

export function FieldConfigSection() {
    const router = useRouter()
    const [configs, setConfigs] = useState<Record<string, FieldConfig>>({
        id1: { targetField: 'id1', fieldName: '', fieldType: 'STRING', hasPrefix: false, prefix: '', isActive: true, displayOnDashboard: true },
        id2: { targetField: 'id2', fieldName: '', fieldType: 'NUMBER', hasPrefix: false, prefix: '', isActive: true, displayOnDashboard: true }
    })
    const [loading, setLoading] = useState(false)
    const [collapsed, setCollapsed] = useState({ id: false })

    const toggleCollapse = (section: keyof typeof collapsed) => {
        setCollapsed(prev => ({ ...prev, [section]: !prev[section] }))
    }

    useEffect(() => {
        loadConfigs()
    }, [])

    const loadConfigs = async () => {
        setLoading(true)
        const res = await getFieldConfigs()
        if (res.success && res.data) {
            const nextConfigs = { ...configs }
            res.data.forEach((cfg: any) => {
                nextConfigs[cfg.targetField] = {
                    targetField: cfg.targetField,
                    fieldName: cfg.fieldName,
                    fieldType: cfg.fieldType,
                    hasPrefix: cfg.hasPrefix,
                    prefix: cfg.prefix || '',
                    isActive: cfg.isActive ?? true,
                    displayOnDashboard: cfg.displayOnDashboard ?? true
                }
            })
            setConfigs(nextConfigs)
        }
        setLoading(false)
    }

    const handleChange = (target: string, field: keyof FieldConfig, value: any) => {
        setConfigs(prev => ({
            ...prev,
            [target]: { ...prev[target], [field]: value }
        }))
    }

    const handleSave = async (target: string) => {
        const config = configs[target]
        if (!config.fieldName) {
            toast.error('Field name is required')
            return
        }

        // Infer hasPrefix from prefix value existence
        const payload = {
            ...config,
            hasPrefix: !!config.prefix && config.prefix.length > 0
        }

        const res = await saveFieldConfig(payload)
        if (res.success) {
            toast.success('Configuration saved')
            router.refresh()
        } else {
            toast.error(res.message)
        }
    }

    return (
        <div className="space-y-6">
            {/* ID Configuration Section */}
            <div className="border border-border rounded-xl p-4 bg-card">
                <div
                    className="flex justify-between items-center cursor-pointer group"
                    onClick={() => toggleCollapse('id')}
                >
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">ID Field Configuration</h3>
                        {!collapsed.id && (
                            <span className="text-xs text-muted-foreground font-normal ml-2">Enable and customize unique ID fields</span>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {collapsed.id ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </Button>
                </div>

                {!collapsed.id && (
                    <div className="space-y-4 bg-muted/30 p-6 rounded-lg border border-border/50 mt-4">
                        {/* ID1 Configuration */}
                        <div className="flex items-end gap-4">
                            <div className="flex items-center gap-2 pb-3 w-32">
                                <Checkbox
                                    id="id1-active"
                                    checked={configs.id1.isActive}
                                    onCheckedChange={(checked) => handleChange('id1', 'isActive', checked)}
                                />
                                <Label htmlFor="id1-active" className="cursor-pointer font-bold">Set ID1:</Label>
                            </div>

                            <div className="space-y-1 flex-1">
                                <Label className="text-xs text-muted-foreground">Display Name</Label>
                                <Input
                                    value={configs.id1.fieldName}
                                    onChange={(e) => handleChange('id1', 'fieldName', e.target.value)}
                                    placeholder="e.g. Salesforce ID"
                                    disabled={!configs.id1.isActive}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-1 w-32">
                                <Label className="text-xs text-muted-foreground">Type</Label>
                                <Select
                                    value={configs.id1.fieldType}
                                    onValueChange={(val) => handleChange('id1', 'fieldType', val)}
                                    disabled={!configs.id1.isActive}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STRING">String</SelectItem>
                                        <SelectItem value="NUMBER">Number</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 w-32">
                                <Label className="text-xs text-muted-foreground">Prefix</Label>
                                <Input
                                    value={configs.id1.prefix}
                                    onChange={(e) => handleChange('id1', 'prefix', e.target.value)}
                                    placeholder=""
                                    disabled={!configs.id1.isActive || configs.id1.fieldType === 'NUMBER'}
                                    className="h-9"
                                />
                            </div>

                            <div className="flex items-center gap-2 pb-3">
                                <Checkbox
                                    id="id1-display"
                                    checked={configs.id1.displayOnDashboard}
                                    onCheckedChange={(checked) => handleChange('id1', 'displayOnDashboard', checked)}
                                    disabled={!configs.id1.isActive}
                                />
                                <Label htmlFor="id1-display" className="cursor-pointer text-xs">Display</Label>
                            </div>

                            <Button onClick={() => handleSave('id1')} disabled={loading} size="sm" className="h-9 mb-[1px]">
                                Set
                            </Button>
                        </div>

                        {/* ID2 Configuration */}
                        <div className="flex items-end gap-4 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2 pb-3 w-32">
                                <Checkbox
                                    id="id2-active"
                                    checked={configs.id2.isActive}
                                    onCheckedChange={(checked) => handleChange('id2', 'isActive', checked)}
                                />
                                <Label htmlFor="id2-active" className="cursor-pointer font-bold">Set ID2:</Label>
                            </div>

                            <div className="space-y-1 flex-1">
                                <Label className="text-xs text-muted-foreground">Display Name</Label>
                                <Input
                                    value={configs.id2.fieldName}
                                    onChange={(e) => handleChange('id2', 'fieldName', e.target.value)}
                                    placeholder="e.g. Tracking ID"
                                    disabled={!configs.id2.isActive}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-1 w-32">
                                <Label className="text-xs text-muted-foreground">Type</Label>
                                <Select
                                    value={configs.id2.fieldType}
                                    onValueChange={(val) => handleChange('id2', 'fieldType', val)}
                                    disabled={!configs.id2.isActive}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STRING">String</SelectItem>
                                        <SelectItem value="NUMBER">Number</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 w-32">
                                <Label className="text-xs text-muted-foreground">Prefix</Label>
                                <Input
                                    value={configs.id2.prefix}
                                    onChange={(e) => handleChange('id2', 'prefix', e.target.value)}
                                    placeholder=""
                                    disabled={!configs.id2.isActive || configs.id2.fieldType === 'NUMBER'}
                                    className="h-9"
                                />
                            </div>

                            <div className="flex items-center gap-2 pb-3">
                                <Checkbox
                                    id="id2-display"
                                    checked={configs.id2.displayOnDashboard}
                                    onCheckedChange={(checked) => handleChange('id2', 'displayOnDashboard', checked)}
                                    disabled={!configs.id2.isActive}
                                />
                                <Label htmlFor="id2-display" className="cursor-pointer text-xs">Display</Label>
                            </div>

                            <Button onClick={() => handleSave('id2')} disabled={loading} size="sm" className="h-9 mb-[1px]">
                                Set
                            </Button>
                        </div>
                    </div>
                )}

            </div>

        </div>
    )
}
