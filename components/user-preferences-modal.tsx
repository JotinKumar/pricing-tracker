'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { AvatarUploader } from './ui/avatar-uploader'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { updatePreferences, getLookups } from '@/lib/actions/user'
import { UserSession } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SortOrderManager } from './preferences/sort-order-manager'
import { Loader2 } from 'lucide-react'

interface UserPreferencesModalProps {
    isOpen: boolean
    onClose: () => void
    session: UserSession
}

export function UserPreferencesModal({ isOpen, onClose, session }: UserPreferencesModalProps) {
    const { setTheme, theme } = useTheme()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // General Preferences
    const [avatar, setAvatar] = useState<string | null>(session.avatar || null)
    const [prefTheme, setPrefTheme] = useState<string>(theme || 'system')
    const [acvUnit, setAcvUnit] = useState<string>('default')
    const [acvDecimals, setAcvDecimals] = useState<string>('default')
    const [dateFormat, setDateFormat] = useState<string>('default')

    // Status Preferences
    const [statusMessage, setStatusMessage] = useState<string>('')
    const [statusIndicator, setStatusIndicator] = useState<string>('ONLINE')

    // Sort Order Preferences (JSON)
    type SortOrder = Record<string, number[]>
    const [sortOrder, setSortOrder] = useState<SortOrder>({
        vertical: [],
        horizontal: [],
        location: [],
        team: []
    })

    // Lookups Data
    const [lookups, setLookups] = useState<{
        verticals: Array<{ id: number; displayOrder: number; vertical: string }>
        horizontals: Array<{ id: number; displayOrder: number; horizontal: string }>
        locations: Array<{ id: number; displayOrder: number; country: string }>
        teams: Array<{ id: number; displayOrder: number; teamname: string }>
    }>({ verticals: [], horizontals: [], locations: [], teams: [] })

    useEffect(() => {
        if (isOpen) {
            /* eslint-disable react-hooks/set-state-in-effect -- one-time sync of persisted user prefs into local form state when the modal opens */
            setPrefTheme(theme || 'system')
            setAvatar(session.avatar || null)
            setAcvUnit(session.preferenceAcvUnit || 'default')
            setAcvDecimals(session.preferenceAcvDecimals || 'default')
            setDateFormat(session.preferenceDateFormat || 'default')
            setStatusMessage(session.statusMessage || '')
            setStatusIndicator(session.statusIndicator || 'ONLINE')
            /* eslint-enable react-hooks/set-state-in-effect */

            // Parse existing sort order
            try {
                const parsed = session.preferenceSortOrder ? JSON.parse(session.preferenceSortOrder) : {}
                setSortOrder(prev => ({ ...prev, ...parsed }))
            } catch (e) {
                console.error("Failed to parse sort order", e)
            }

            // Fetch Lookups
            setLoading(true)
            getLookups().then(res => {
                if (res.success && res.data) {
                    setLookups(res.data)
                }
                setLoading(false)
            })
        }
    }, [isOpen, theme, session])

    // Apply saved sort order to the fetched lists
    const getSortedList = (list: Array<{ id: number; displayOrder: number; vertical?: string; horizontal?: string; country?: string; teamname?: string; name?: string }>, type: string) => {
        const order = sortOrder[type] || []
        if (!order.length) return list

        // Create a map for O(1) lookup
        const orderMap = new Map(order.map((id: number, index: number) => [id, index]))

        // Sort: items in order map first, then others by displayOrder
        return [...list].sort((a, b) => {
            const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999
            const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999

            if (indexA !== indexB) return indexA - indexB
            return a.displayOrder - b.displayOrder
        })
    }

    const handleSortChange = (type: string, newOrderIds: number[]) => {
        setSortOrder(prev => ({
            ...prev,
            [type]: newOrderIds
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        // Update Theme immediately
        setTheme(prefTheme)

        const res = await updatePreferences({
            avatar,
            preferenceTheme: prefTheme,
            preferenceAcvUnit: acvUnit === 'default' ? null : acvUnit,
            preferenceAcvDecimals: acvDecimals === 'default' ? null : acvDecimals,
            preferenceDateFormat: dateFormat === 'default' ? null : dateFormat,
            statusMessage,
            statusIndicator,
            preferenceSortOrder: JSON.stringify(sortOrder)
        })

        if (res.success) {
            toast.success('Preferences updated')
            onClose()
            window.location.reload()
        } else {
            toast.error(res.message || 'Failed to update preferences')
        }
        setSaving(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden p-0">
                <div className="px-6 pt-6 pb-2">
                    <DialogHeader>
                        <DialogTitle>User Preferences</DialogTitle>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-auto px-6 py-2">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="sort">My Sort Order</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-6">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-4">
                                <AvatarUploader
                                    avatarUrl={avatar || undefined}
                                    firstName={session.name || 'User'}
                                    onAvatarChange={(url) => setAvatar(url)}
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-3 border-t pt-4">
                                <h4 className="text-sm font-medium">My Status</h4>
                                <div className="grid grid-cols-[1fr,140px] gap-3">
                                    <Input
                                        placeholder="What's your status?"
                                        value={statusMessage}
                                        onChange={(e) => setStatusMessage(e.target.value)}
                                        maxLength={50}
                                    />
                                    <Select value={statusIndicator} onValueChange={setStatusIndicator}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ONLINE">
                                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Online</div>
                                            </SelectItem>
                                            <SelectItem value="BUSY">
                                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Busy</div>
                                            </SelectItem>
                                            <SelectItem value="AWAY">
                                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Away</div>
                                            </SelectItem>
                                            <SelectItem value="OFFLINE">
                                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-500"></span> Offline</div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Theme */}
                            <div className="space-y-2 border-t pt-4">
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
                            </div>
                        </TabsContent>

                        <TabsContent value="sort" className="h-[400px] flex flex-col">
                            <p className="text-xs text-muted-foreground mb-4">
                                Drag and drop to reorder how items appear in your dropdowns. This only affects your view.
                            </p>

                            {loading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <Tabs defaultValue="vertical" className="flex-1 flex flex-col overflow-hidden">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="vertical">Verticals</TabsTrigger>
                                        <TabsTrigger value="horizontal">Horizontals</TabsTrigger>
                                        <TabsTrigger value="location">Locations</TabsTrigger>
                                        {/* Teams logic could be complicated due to custom sort, but user can override */}
                                    </TabsList>
                                    <div className="flex-1 overflow-hidden mt-2 border rounded-md p-1">
                                        <TabsContent value="vertical" className="h-full">
                                            <SortOrderManager
                                                items={getSortedList(lookups.verticals, 'vertical').map(i => ({ id: i.id, name: i.vertical || '' }))}
                                                onOrderChange={(ids) => handleSortChange('vertical', ids)}
                                            />
                                        </TabsContent>
                                        <TabsContent value="horizontal" className="h-full">
                                            <SortOrderManager
                                                items={getSortedList(lookups.horizontals, 'horizontal').map(i => ({ id: i.id, name: i.horizontal || '' }))}
                                                onOrderChange={(ids) => handleSortChange('horizontal', ids)}
                                            />
                                        </TabsContent>
                                        <TabsContent value="location" className="h-full">
                                            <SortOrderManager
                                                items={getSortedList(lookups.locations, 'location').map(i => ({ id: i.id, name: i.country || '' }))}
                                                onOrderChange={(ids) => handleSortChange('location', ids)}
                                            />
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="p-6 pt-2 border-t mt-auto bg-card">
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
