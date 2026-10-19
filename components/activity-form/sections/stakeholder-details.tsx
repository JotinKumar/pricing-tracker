'use client'

import { useState, useEffect, useRef } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Plus, Trash } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ActivityFormValues } from '@/lib/schemas'
import { getManagersWithTeams } from '@/lib/actions/user'
import { SectionProps } from './shared'
import { toast } from 'sonner'

export function StakeholderDetails({ lookups, session, lockedUserIds = [], ownerId: propOwnerId, autoManagerIds = [], onAutoManagerIdsChange }: SectionProps) {
    const { control, watch, setValue } = useFormContext<ActivityFormValues>()
    const isReadOnly = session.role === 'READ_ONLY'

    // Determine owner: Prop (Edit/Explicit) > Session (Create/Default)
    const ownerId = propOwnerId || session.id

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "teamMembers"
    })

    const isInitialMount = useRef(true)

    const teams = lookups.teams || []

    // Watch all team members; build a signature of manually-added (explicit) members
    // to detect when the user adds or removes someone.
    const allFields = watch('teamMembers') || []
    const autoTeamNames = ['Hierarchical Team', 'Default Team']
    const autoTeamIds = new Set(
        teams.filter(t => autoTeamNames.includes(t.teamname || t.display || '')).map(t => t.id)
    )
    const isUserAutoAdded = (userId: number) =>
        lockedUserIds.includes(userId) || autoManagerIds.includes(userId)

    // Explicit = manually added members (not auto-assigned, not auto-managers, not in auto teams)
    const explicitMembers = allFields.filter(f =>
        !isUserAutoAdded(Number(f.userId)) && !autoTeamIds.has(Number(f.teamId))
    )
    const explicitSignature = JSON.stringify(explicitMembers.map(f => `${f.teamId}-${f.userId}`))

    useEffect(() => {
        let isMounted = true

        const updateManagers = async () => {
            // Fetch managers for ALL team members + owner (not just "explicit" ones).
            // This ensures we correctly identify auto-added managers that were
            // saved to the DB on a previous edit session.
            const allUserIds = new Set<number>()
            if (ownerId) allUserIds.add(ownerId)
            allFields.forEach(m => m.userId && allUserIds.add(Number(m.userId)))

            if (allUserIds.size === 0) {
                if (autoManagerIds.length > 0) onAutoManagerIdsChange?.([])
                isInitialMount.current = false
                return
            }

            const managers = await getManagersWithTeams(Array.from(allUserIds))
            if (!isMounted) return

            // Any team member whose userId appears in the managers list is auto-added
            // (they are a manager of the owner or of another team member).
            const managerIdSet = new Set(managers.map(m => m.id))
            const autoIds = allFields
                .filter(f => managerIdSet.has(Number(f.userId)) && Number(f.userId) !== Number(ownerId))
                .map(f => Number(f.userId))

            // Update autoManagerIds for classification
            const newAutoSig = JSON.stringify(autoIds.sort())
            const currentAutoSig = JSON.stringify([...autoManagerIds].sort())
            if (newAutoSig !== currentAutoSig) {
                onAutoManagerIdsChange?.(autoIds)
            }

            // On initial mount (e.g. editing an existing activity), update the form's
            // isAutoAdded flags to match the authoritative manager classification.
            // This fixes records that were saved before the isAutoAdded field existed.
            if (isInitialMount.current) {
                isInitialMount.current = false
                // Update form values: set isAutoAdded=true for managers, false for others
                const updatedFields = allFields.map(f => ({
                    ...f,
                    isAutoAdded: managerIdSet.has(Number(f.userId)) && Number(f.userId) !== Number(ownerId)
                }))
                setValue('teamMembers', updatedFields)
                return
            }

            // On subsequent changes (user added/removed a member): rebuild if needed.
            // Expected managers = all managers (excluding owner) with a valid team.
            const expectedManagers = managers
                .filter(m => m.teamId !== null && m.id !== Number(ownerId))
                .map(m => ({ userId: m.id, teamId: m.teamId!, isAutoAdded: true }))
            const expectedManagerIds = new Set(expectedManagers.map(m => m.userId))

            // Check if any expected manager is missing from the form
            const existingUserIds = new Set(allFields.map(f => Number(f.userId)))
            const hasMissingManagers = expectedManagers.some(m => !existingUserIds.has(m.userId))

            // Check if any current auto-member should be removed (no longer expected)
            const currentAutoInForm = allFields.filter(f =>
                autoManagerIds.includes(Number(f.userId))
            )
            const hasStaleManagers = currentAutoInForm.some(f =>
                !expectedManagerIds.has(Number(f.userId))
            )

            if (hasMissingManagers || hasStaleManagers) {
                // Rebuild: keep non-auto members + expected managers
                const autoIdSet = new Set([...autoIds, ...autoManagerIds])
                const nonAutoMembers = allFields.filter(f =>
                    !autoIdSet.has(Number(f.userId))
                )
                replace([...nonAutoMembers, ...expectedManagers])
            }
        }

        updateManagers()

        return () => { isMounted = false }
    }, [explicitSignature, ownerId]) // eslint-disable-line react-hooks/exhaustive-deps

    // Local state for the "Add Member" controls
    const [selectedTeamId, setSelectedTeamId] = useState<string>('')
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const [showHidden, setShowHidden] = useState(false)

    const selectedTeam = teams.find(t => t.id === Number(selectedTeamId))
    const teamUsers = selectedTeam?.users || []

    const handleAddMember = () => {
        if (!selectedTeamId || !selectedUserId) return

        // Check if already exists
        const exists = fields.some(f => f.teamId === Number(selectedTeamId) && f.userId === Number(selectedUserId))
        if (exists) {
            toast.error("This member is already added to the deal team.")
            return
        }

        append({ teamId: Number(selectedTeamId), userId: Number(selectedUserId), isAutoAdded: false })

        // Reset controls
        setSelectedTeamId('')
        setSelectedUserId('')
    }

    // Classify members as manually added or auto added
    const isAutoAdded = (field: typeof allFields[number]) => {
        const team = teams.find(t => t.id === field.teamId)
        const teamName = team?.teamname || team?.display || ''
        if (autoTeamNames.includes(teamName)) return true
        if (field.userId && isUserAutoAdded(Number(field.userId))) return true
        return false
    }

    const manuallyAdded = fields.filter((_, i) => !isAutoAdded(allFields[i]))
    const autoAdded = fields.filter((_, i) => isAutoAdded(allFields[i]))

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Deal Team</h3>
                <div className="flex items-center space-x-2">
                    <Checkbox id="showHidden" checked={showHidden} onCheckedChange={(c) => setShowHidden(!!c)} />
                    <Label htmlFor="showHidden" className="text-xs font-medium text-muted-foreground cursor-pointer">
                        Show auto-added members
                    </Label>
                </div>
            </div>

            {!isReadOnly && (
                <div className="flex flex-col sm:flex-row gap-3 items-end p-4 bg-muted/10 border border-input rounded-lg">
                    <div className="w-full sm:w-1/3 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Select Team</label>
                        <Select value={selectedTeamId} onValueChange={(val) => { setSelectedTeamId(val); setSelectedUserId('') }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Team" />
                            </SelectTrigger>
                            <SelectContent>
                                {teams.map(t => (
                                    <SelectItem key={t.id} value={String(t.id)}>{t.teamname || t.display}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full sm:w-1/3 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Select Member</label>
                        <Select
                            value={selectedUserId}
                            onValueChange={setSelectedUserId}
                            disabled={!selectedTeamId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Member" />
                            </SelectTrigger>
                            <SelectContent>
                                {teamUsers.map(u => (
                                    <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full sm:w-auto">
                        <Button
                            type="button"
                            onClick={handleAddMember}
                            disabled={!selectedTeamId || !selectedUserId}
                            className="w-full sm:w-auto gap-2"
                        >
                            <Plus className="h-4 w-4" /> Add
                        </Button>
                    </div>
                </div>
            )}

            {/* Manually Added Members */}
            <div className="border border-input rounded-md overflow-hidden bg-background">
                <div className="border-b border-border bg-muted/50 px-3 py-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Manually Added{manuallyAdded.length > 0 && ` (${manuallyAdded.length})`}
                    </span>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="px-3 py-1 text-left font-medium text-muted-foreground w-1/3 border-r border-border">Team</th>
                            <th className="px-3 py-1 text-left font-medium text-muted-foreground">Member</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {manuallyAdded.map((field) => {
                            const index = fields.indexOf(field)
                            const team = teams.find(t => t.id === field.teamId)
                            const user = team?.users.find(u => u.id === field.userId) || lookups.users?.find(u => u.id === field.userId)

                            return (
                                <tr key={field.id} className="group hover:bg-muted/10 transition-colors">
                                    <td className="px-3 py-1 w-[200px] align-top bg-muted/5 border-r border-border">
                                        <div className="flex items-center justify-between gap-2 h-full">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                {team?.teamname || team?.display || 'Unknown Team'}
                                            </div>
                                            {!isReadOnly && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => remove(index)}
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove"
                                                >
                                                    <Trash className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-1 align-middle text-foreground">
                                        <span className="text-sm font-medium">
                                            {user?.name || 'Unknown Member'}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                        {manuallyAdded.length === 0 && (
                            <tr>
                                <td colSpan={2} className="p-4 text-center text-muted-foreground text-sm italic">
                                    No manually added members.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Auto Added Members */}
            {showHidden && autoAdded.length > 0 && (
                <div className="border border-input rounded-md overflow-hidden bg-background">
                    <div className="border-b border-border bg-muted/30 px-3 py-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Auto Added ({autoAdded.length})
                        </span>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-3 py-1 text-left font-medium text-muted-foreground w-1/3 border-r border-border">Team</th>
                                <th className="px-3 py-1 text-left font-medium text-muted-foreground">Member</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {autoAdded.map((field) => {
                                const index = fields.indexOf(field)
                                const team = teams.find(t => t.id === field.teamId)
                                const user = team?.users.find(u => u.id === field.userId) || lookups.users?.find(u => u.id === field.userId)
                                const isLocked = field.userId && isUserAutoAdded(Number(field.userId))

                                return (
                                    <tr key={field.id} className="group hover:bg-muted/10 transition-colors">
                                        <td className="px-3 py-1 w-[200px] align-top bg-muted/5 border-r border-border">
                                            <div className="flex items-center justify-between gap-2 h-full">
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                                    {team?.teamname || team?.display || 'Unknown Team'}
                                                </div>
                                                {!isLocked && !isReadOnly && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => remove(index)}
                                                        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Remove"
                                                    >
                                                        <Trash className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                {isLocked && (
                                                    <div title="Auto-assigned (Locked)" className="cursor-not-allowed opacity-50">
                                                        <Trash className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-1 align-middle text-foreground">
                                            <span className="text-sm font-medium">
                                                {user?.name || 'Unknown Member'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
