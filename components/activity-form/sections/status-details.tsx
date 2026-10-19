'use client'

import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ActivityFormValues } from '@/lib/schemas'
import { SectionProps, renderOptions } from './shared'
import { PricingActivityWithHistory } from '@/types'

interface StatusDetailsProps extends SectionProps {
    activity?: PricingActivityWithHistory | null
}

export function StatusDetails({ lookups, session, activity }: StatusDetailsProps) {
    const { control } = useFormContext<ActivityFormValues>()
    const isReadOnly = session.role === 'READ_ONLY'

    // Last activity date = latest history entry createdAt
    const lastActivityDate = activity?.history?.[0]?.createdAt
    const formattedLastActivityDate = lastActivityDate
        ? new Date(lastActivityDate).toISOString().split('T')[0]
        : ''

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <FormItem>
                <FormLabel className="uppercase text-xs text-muted-foreground">Last Activity Date</FormLabel>
                <FormControl>
                    <Input
                        type="date"
                        readOnly
                        disabled
                        value={formattedLastActivityDate}
                        placeholder="No activity yet"
                    />
                </FormControl>
            </FormItem>
        </div>
    )
}
