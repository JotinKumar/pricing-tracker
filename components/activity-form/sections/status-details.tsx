'use client'

import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActivityFormValues } from '@/lib/schemas'
import { SectionProps, renderOptions } from './shared'

export function StatusDetails({ lookups, session }: SectionProps) {
    const { control } = useFormContext<ActivityFormValues>()
    const isReadOnly = session.role === 'READ_ONLY'

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
                control={control}
                name="versionId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="uppercase text-xs text-muted-foreground">Version</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Version" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {renderOptions(lookups.versions)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="statusId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="uppercase text-xs text-muted-foreground">Current Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                            <FormControl>
                                <SelectTrigger className="font-semibold text-primary">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {renderOptions(lookups.statuses)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="outcomeId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="uppercase text-xs text-muted-foreground">Outcome</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Outcome" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {renderOptions(lookups.outcomes)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}
