'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { FormField, FormItem, FormControl } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActivityFormValues } from '@/lib/schemas'
import { SectionProps, renderOptions } from './shared'

export function StakeholderDetails({ lookups, session, lockedUserIds = [] }: SectionProps) {
    const { control, watch } = useFormContext<ActivityFormValues>()
    const isReadOnly = session.role === 'READ_ONLY'

    const { fields, append, remove } = useFieldArray({
        control,
        name: "teamMembers"
    })

    const teams = lookups.teams || []

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Deal Team</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ teamId: 0, userId: 0 })}
                    disabled={isReadOnly}
                    className="h-8 gap-2"
                >
                    <Plus className="h-4 w-4" /> Add Member
                </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="p-3 text-left font-medium text-muted-foreground">Team</th>
                            <th className="p-3 text-left font-medium text-muted-foreground">Member</th>
                            <th className="p-3 w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {fields.map((field, index) => {
                            // Watch the teamId to filter users
                            const teamIdVal = watch(`teamMembers.${index}.teamId`)
                            const selectedTeam = teams.find(t => t.id === Number(teamIdVal))
                            const teamUsers = selectedTeam?.users || []

                            return (
                                <tr key={field.id} className="bg-background">
                                    <td className="p-3">
                                        <FormField
                                            control={control}
                                            name={`teamMembers.${index}.teamId`}
                                            render={({ field }) => (
                                                <FormItem className="space-y-0">
                                                    <Select
                                                        onValueChange={(val) => field.onChange(Number(val))}
                                                        value={String(field.value || '')}
                                                        disabled={isReadOnly}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Team" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {renderOptions(teams)}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                    </td>
                                    <td className="p-3">
                                        <FormField
                                            control={control}
                                            name={`teamMembers.${index}.userId`}
                                            render={({ field }) => (
                                                <FormItem className="space-y-0">
                                                    <Select
                                                        onValueChange={(val) => field.onChange(Number(val))}
                                                        value={String(field.value || '')}
                                                        disabled={isReadOnly || !teamIdVal}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select User" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {teamUsers.map(u => (
                                                                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                    </td>
                                    <td className="p-3 text-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            disabled={isReadOnly || (field.userId ? lockedUserIds?.includes(Number(field.userId)) : false)}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:hover:text-muted-foreground"
                                            title={field.userId && lockedUserIds?.includes(Number(field.userId)) ? "Default user (Locked)" : "Remove"}
                                        >
                                            {field.userId && lockedUserIds?.includes(Number(field.userId)) ? (
                                                <Trash2 className="h-4 w-4 opacity-50" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                        {fields.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-muted-foreground">
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
