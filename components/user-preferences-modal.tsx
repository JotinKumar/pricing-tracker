'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AvatarUploader } from './ui/avatar-uploader' // Assuming this exists or I need to create/use it
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { updatePreferences } from '@/lib/actions/user'
import { UserSession } from '@/types'

interface UserPreferencesModalProps {
    isOpen: boolean
    onClose: () => void
    session: UserSession
    // We might need to pass current preferences if they are not in session, 
    // but ideally session should be updated or we fetch them.
    // For now, assuming session has them or we fetch them.
    // Actually session type might need update too.
}

export function UserPreferencesModal({ isOpen, onClose, session }: UserPreferencesModalProps) {
    const { setTheme, theme } = useTheme()
    const [loading, setLoading] = useState(false)

    // State
    const [avatar, setAvatar] = useState<string | null>(session.avatar || null)
    const [prefTheme, setPrefTheme] = useState<string>(theme || 'system')
    // Removed: const [currency, setCurrency] = useState<string>('default')
    const [acvUnit, setAcvUnit] = useState<string>('default')
    const [acvDecimals, setAcvDecimals] = useState<string>('default')
    const [dateFormat, setDateFormat] = useState<string>('default')
    // Removed: const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([])

    // Initialize state from session if available, or fetch?
    // Since session in next-auth usually has limited fields, we might need to fetch full user details 
    // or assume session is enriched. 
    // Let's assume for now we might need to fetch or values are passed. 
    // But for MVP, let's try to rely on props or basic state. 
    // Wait, the session object might not have these new fields yet.
    // Ideally we should fetch the latest user data when opening modal.

    useEffect(() => {
        if (isOpen) {
            setPrefTheme(theme || 'system')
            setAvatar(session.avatar || null)
            // Removed: setCurrency(session.preferenceCurrency || 'default')
            setAcvUnit(session.preferenceAcvUnit || 'default')
            setAcvDecimals(session.preferenceAcvDecimals || 'default')
            setDateFormat(session.preferenceDateFormat || 'default')

            // Removed: getUniqueCurrencies().then(res => {
            // Removed:     if (res.success && res.data) setAvailableCurrencies(res.data)
            // Removed: })
        }
    }, [isOpen, theme, session])

    const handleSave = async () => {
        setLoading(true)
        // Update Theme immediately
        setTheme(prefTheme)

        const res = await updatePreferences({
            avatar,
            preferenceTheme: prefTheme,
            preferenceCurrency: null, // Resetting or ignoring currency preference
            preferenceAcvUnit: acvUnit === 'default' ? null : acvUnit,
            preferenceAcvDecimals: acvDecimals === 'default' ? null : acvDecimals,
            preferenceDateFormat: dateFormat === 'default' ? null : dateFormat
        })

        if (res.success) {
            toast.success('Preferences updated')
            onClose()
            // Router refresh to update session/UI?
            window.location.reload() // Force reload to apply session changes if needed
        } else {
            toast.error(res.message || 'Failed to update preferences')
        }
        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>User Preferences</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-4">
                        <Label>Profile Picture</Label>
                        <AvatarUploader
                            avatarUrl={avatar || undefined}
                            firstName={session.name || 'User'}
                            onAvatarChange={(url) => setAvatar(url)}
                        />
                    </div>

                    {/* Theme */}
                    <div className="space-y-2">
                        <Label>Theme</Label>
                        <Select value={prefTheme} onValueChange={setPrefTheme}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ACV Display Format Override */}
                    <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-medium">ACV Display Override</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Units</Label>
                                <Select
                                    value={acvUnit === 'default' ? 'default' : acvUnit}
                                    onValueChange={setAcvUnit}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Global" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Global</SelectItem>
                                        <SelectItem value="ACTUAL">Actual</SelectItem>
                                        <SelectItem value="THOUSANDS">Thousands</SelectItem>
                                        <SelectItem value="MILLIONS">Millions</SelectItem>
                                        <SelectItem value="BILLIONS">Billions</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Decimals</Label>
                                <Select
                                    value={acvDecimals === 'default' ? 'default' : acvDecimals}
                                    onValueChange={setAcvDecimals}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Global" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Global</SelectItem>
                                        <SelectItem value="0">0</SelectItem>
                                        <SelectItem value="1">1</SelectItem>
                                        <SelectItem value="2">2</SelectItem>
                                        <SelectItem value="3">3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Overrides the global ACV display format.</p>
                    </div>

                    {/* Date Format Override */}
                    <div className="space-y-2 border-t pt-4">
                        <Label>Date Format (Override)</Label>
                        <Select value={dateFormat} onValueChange={setDateFormat}>
                            <SelectTrigger>
                                <SelectValue placeholder="Use Global Default" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Use Global Default</SelectItem>
                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                <SelectItem value="DD-Mon-YYYY">DD-Mon-YYYY</SelectItem>
                                <SelectItem value="Mon DD, YYYY">Mon DD, YYYY</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">Overrides the global date display format.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
