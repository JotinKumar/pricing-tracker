'use client'

import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { MultiSelect } from '../multi-select'
import { ActivityFormValues } from '@/lib/schemas'
import { SectionProps } from './shared'

export function LocationDetails({ lookups, session }: SectionProps) {
    const { control } = useFormContext<ActivityFormValues>()
    const isReadOnly = session.role === 'READ_ONLY'

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={control}
                name="clientLocationIds"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="uppercase text-xs text-muted-foreground">Client Location</FormLabel>
                        <FormControl>
                            <MultiSelect
                                options={lookups.locations}
                                selectedIds={field.value}
                                onChange={field.onChange}
                                placeholder="Select Locations"
                                disabled={isReadOnly}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="deliveryLocationIds"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="uppercase text-xs text-muted-foreground">Delivery Location</FormLabel>
                        <FormControl>
                            <MultiSelect
                                options={lookups.locations}
                                selectedIds={field.value}
                                onChange={field.onChange}
                                placeholder="Select Locations"
                                disabled={isReadOnly}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}
