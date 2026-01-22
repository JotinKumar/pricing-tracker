'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-custom'
import { getSystemSetting, updateSystemSetting } from '@/lib/actions/admin'
import { FieldConfigSection } from '../field-config-section'

export function SettingsTab() {
    const { addToast } = useToast()
    const [financialYearStart, setFinancialYearStart] = useState<string>('0')

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const fyOptions = months.map((m, i) => {
        const nextIndex = (i + 11) % 12;
        const nextMonthShort = months[nextIndex].substring(0, 3);
        const currentMonthShort = m.substring(0, 3);
        return { value: String(i), label: `${currentMonthShort}-${nextMonthShort}` };
    });

    useEffect(() => {
        loadFYSettings()
    }, [])

    const loadFYSettings = async () => {
        const res = await getSystemSetting('FY_START_MONTH')
        if (res.success && res.data) {
            setFinancialYearStart(res.data)
        }
    }

    const handleSaveFYSettings = async () => {
        const res = await updateSystemSetting('FY_START_MONTH', financialYearStart)
        if (res.success) {
            addToast({ type: 'success', title: 'Saved', message: 'Financial Year settings updated' })
        } else {
            addToast({ type: 'error', title: 'Error', message: res.message || 'Failed to save settings' })
        }
    }

    return (
        <div className="space-y-8 h-full overflow-auto">
            {/* Financial Year Section */}
            <div className="space-y-6">
                <div className="flex-none">
                    <h3 className="text-lg font-bold">Financial Year Settings</h3>
                    <p className="text-sm text-muted-foreground">Configure global financial year of your organization</p>
                </div>

                <div className="space-y-4 bg-muted/30 p-6 rounded-lg max-w-4xl border border-border/50">
                    <div className="flex items-end gap-4">
                        <div className="space-y-2 w-64">
                            <Label>Financial Year</Label>
                            <Select value={financialYearStart} onValueChange={setFinancialYearStart}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fyOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleSaveFYSettings}>Set Financial Year</Button>
                    </div>
                </div>
            </div>

            {/* Field Config Section */}
            <FieldConfigSection />
        </div>
    )
}
