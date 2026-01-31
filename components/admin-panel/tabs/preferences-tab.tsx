'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-custom'
import { getFieldConfigs, saveFieldConfig } from '@/lib/actions/field-config'
import { getUniqueCurrencies } from '@/lib/actions/location'
import { useRouter } from 'next/navigation'
import { Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'

interface FieldConfig {
    targetField: string
    fieldName: string
    fieldType: string
    hasPrefix: boolean
    prefix?: string
    isActive: boolean
    displayOnDashboard: boolean
}

export function PreferencesTab() {
    const router = useRouter()
    const { addToast } = useToast()
    const [configs, setConfigs] = useState<Record<string, FieldConfig>>({
        acv: { targetField: 'acv', fieldName: 'ACTUAL', fieldType: '0', hasPrefix: false, prefix: '$', isActive: true, displayOnDashboard: true },
        date: { targetField: 'date', fieldName: 'MM/DD/YYYY', fieldType: 'DATE', hasPrefix: false, prefix: '', isActive: true, displayOnDashboard: true }
    })
    const [loading, setLoading] = useState(false)
    const [collapsed, setCollapsed] = useState({ acv: false, date: false })

    const toggleCollapse = (section: keyof typeof collapsed) => {
        setCollapsed(prev => ({ ...prev, [section]: !prev[section] }))
    }

    useEffect(() => {
        loadConfigs()
        loadCurrencies()
    }, [])

    const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([])
    const loadCurrencies = async () => {
        const res = await getUniqueCurrencies()
        if (res.success && res.data) {
            setAvailableCurrencies(res.data)
        }
    }

    const loadConfigs = async () => {
        setLoading(true)
        const res = await getFieldConfigs()
        if (res.success && res.data) {
            const nextConfigs = { ...configs }
            res.data.forEach((cfg: any) => {
                if (configs[cfg.targetField]) {
                    nextConfigs[cfg.targetField] = {
                        targetField: cfg.targetField,
                        fieldName: cfg.fieldName,
                        fieldType: cfg.fieldType,
                        hasPrefix: cfg.hasPrefix,
                        prefix: cfg.prefix || '',
                        isActive: cfg.isActive ?? true,
                        displayOnDashboard: cfg.displayOnDashboard ?? true
                    }
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
        <div className="space-y-8 h-full overflow-auto p-1">
            <div className="flex-none">
                <h3 className="text-lg font-bold">System Preferences</h3>
                <p className="text-sm text-muted-foreground">Configure global display formats for currency and dates.</p>
            </div>

            {/* ACV Display Format */}
            <div className="border border-border rounded-xl p-4 bg-card">
                <div
                    className="flex justify-between items-center cursor-pointer group"
                    onClick={() => toggleCollapse('acv')}
                >
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">ACV Display Format</h3>
                        {!collapsed.acv && (
                            <span className="text-xs text-muted-foreground font-normal ml-2">Configure how Annual Contract Value is displayed</span>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {collapsed.acv ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </Button>
                </div>

                {!collapsed.acv && (
                    <div className="space-y-4 bg-muted/30 p-6 rounded-lg border border-border/50 mt-4">
                        <div className="flex items-end gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Currency</Label>
                                <Select
                                    value={configs.acv.prefix || '$'}
                                    onValueChange={(val) => handleChange('acv', 'prefix', val)}
                                >
                                    <SelectTrigger className="h-9 w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="$">USD ($)</SelectItem>
                                        <SelectItem value="€">EUR (€)</SelectItem>
                                        <SelectItem value="£">GBP (£)</SelectItem>
                                        <SelectItem value="₹">INR (₹)</SelectItem>
                                        {availableCurrencies.map(c => {
                                            if (['$', '€', '£', '₹'].includes(c)) return null;
                                            return <SelectItem key={c} value={c}>{c}</SelectItem>
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Display Units</Label>
                                <Select
                                    value={configs.acv.fieldName}
                                    onValueChange={(val) => {
                                        handleChange('acv', 'fieldName', val)
                                        // Set default decimals based on unit
                                        const defaultDecimals = val === 'MILLIONS' ? '2' : val === 'BILLIONS' ? '3' : '0'
                                        handleChange('acv', 'fieldType', defaultDecimals)
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTUAL">Actual (1,234,567)</SelectItem>
                                        <SelectItem value="THOUSANDS">Thousands (1,234K)</SelectItem>
                                        <SelectItem value="MILLIONS">Millions (1.23M)</SelectItem>
                                        <SelectItem value="BILLIONS">Billions (0.001B)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Decimals</Label>
                                <Select
                                    value={(() => {
                                        const raw = parseInt(configs.acv.fieldType || '')
                                        if (!isNaN(raw) && raw >= 0 && raw <= 3) return String(raw)
                                        // Return default based on format
                                        const format = configs.acv.fieldName
                                        if (format === 'MILLIONS') return '2'
                                        if (format === 'BILLIONS') return '3'
                                        return '0'
                                    })()}
                                    onValueChange={(val) => handleChange('acv', 'fieldType', val)}
                                >
                                    <SelectTrigger className="h-9 w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">0</SelectItem>
                                        <SelectItem value="1">1</SelectItem>
                                        <SelectItem value="2">2</SelectItem>
                                        <SelectItem value="3">3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="text-sm text-muted-foreground pb-2">
                                Example: <span className="font-semibold text-foreground">
                                    {configs.acv.prefix || '$'}
                                    {(() => {
                                        const raw = parseInt(configs.acv.fieldType || '')
                                        const format = configs.acv.fieldName
                                        const getDefault = () => {
                                            if (format === 'THOUSANDS') return 0
                                            if (format === 'MILLIONS') return 2
                                            if (format === 'BILLIONS') return 3
                                            return 0
                                        }
                                        const decimals = isNaN(raw) ? getDefault() : Math.min(Math.max(raw, 0), 20)
                                        const opts = { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
                                        if (format === 'ACTUAL') return (1234567).toLocaleString(undefined, opts)
                                        if (format === 'THOUSANDS') return (1234.567).toLocaleString(undefined, opts) + 'K'
                                        if (format === 'MILLIONS') return (1.234567).toLocaleString(undefined, opts) + 'M'
                                        if (format === 'BILLIONS') return (0.001234567).toLocaleString(undefined, opts) + 'B'
                                        return (1234567).toLocaleString(undefined, opts)
                                    })()}
                                </span>
                            </div>

                            <Button onClick={() => handleSave('acv')} disabled={loading} size="sm" className="h-9 mb-[1px]">
                                Set
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Date Display Format */}
            <div className="border border-border rounded-xl p-4 bg-card">
                <div
                    className="flex justify-between items-center cursor-pointer group"
                    onClick={() => toggleCollapse('date')}
                >
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">Date Display Format</h3>
                        {!collapsed.date && (
                            <span className="text-xs text-muted-foreground font-normal ml-2">Configure how dates are displayed</span>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {collapsed.date ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </Button>
                </div>

                {!collapsed.date && (
                    <div className="space-y-4 bg-muted/30 p-6 rounded-lg border border-border/50 mt-4">
                        <div className="flex items-end gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Format</Label>
                                <Select
                                    value={configs.date.fieldName}
                                    onValueChange={(val) => handleChange('date', 'fieldName', val)}
                                >
                                    <SelectTrigger className="h-9 w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                        <SelectItem value="DD-Mon-YYYY">DD-Mon-YYYY</SelectItem>
                                        <SelectItem value="Mon DD, YYYY">Mon DD, YYYY</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="text-sm text-muted-foreground pb-2">
                                Example: <span className="font-semibold text-foreground">
                                    {(() => {
                                        const sampleDate = new Date(2026, 0, 27) // Jan 27, 2026
                                        const format = configs.date.fieldName
                                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                        const d = sampleDate.getDate().toString().padStart(2, '0')
                                        const m = (sampleDate.getMonth() + 1).toString().padStart(2, '0')
                                        const y = sampleDate.getFullYear()
                                        const mon = months[sampleDate.getMonth()]

                                        if (format === 'DD/MM/YYYY') return `${d}/${m}/${y}`
                                        if (format === 'YYYY-MM-DD') return `${y}-${m}-${d}`
                                        if (format === 'DD-Mon-YYYY') return `${d}-${mon}-${y}`
                                        if (format === 'Mon DD, YYYY') return `${mon} ${d}, ${y}`
                                        return `${m}/${d}/${y}`
                                    })()}
                                </span>
                            </div>

                            <Button onClick={() => handleSave('date')} disabled={loading} size="sm" className="h-9 mb-[1px]">
                                Set
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
