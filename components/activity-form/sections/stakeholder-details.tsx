'use client'

import { useState } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Plus, Trash } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActivityFormValues } from '@/lib/schemas'
import { SectionProps } from './shared'
import { toast } from 'sonner'

export function StakeholderDetails({ lookups, session, lockedUserIds = [] }: SectionProps) {
    const { control } = useFormContext<ActivityFormValues>()
    const isReadOnly = session.role === 'READ_ONLY'

    const { fields, append, remove } = useFieldArray({
        control,
        name: "teamMembers"
    })

    const teams = lookups.teams || []

    // Local state for the "Add Member" controls
    const [selectedTeamId, setSelectedTeamId] = useState<string>('')
    const [selectedUserId, setSelectedUserId] = useState<string>('')

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

        append({ teamId: Number(selectedTeamId), userId: Number(selectedUserId) })

        // Reset controls
        setSelectedTeamId('')
        setSelectedUserId('')
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Deal Team</h3>

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

            <div className="border border-input rounded-md overflow-hidden bg-background">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="px-3 py-1 text-left font-medium text-muted-foreground w-1/3 border-r border-border">Team</th>
                            <th className="px-3 py-1 text-left font-medium text-muted-foreground">Member</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {fields.map((field, index) => {
                            // We need to look up names because field array only stores IDs
                            const team = teams.find(t => t.id === field.teamId)
                            const user = team?.users.find(u => u.id === field.userId) || lookups.users?.find(u => u.id === field.userId)

                            const isLocked = field.userId && lockedUserIds?.includes(Number(field.userId))

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
                                                <div title="Default user (Locked)" className="cursor-not-allowed opacity-50">
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
                        {fields.length === 0 && (
                            <tr>
                                <td colSpan={2} className="p-4 text-center text-muted-foreground text-sm italic border-dashed">
                                    No team members added.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
