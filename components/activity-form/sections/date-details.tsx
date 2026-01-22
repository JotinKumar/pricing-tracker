'use client'

import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ActivityFormValues } from '@/lib/schemas'
import { SectionProps } from './shared'

export function DateDetails({ session }: SectionProps) {
    const { control } = useFormContext<ActivityFormValues>()
    const isReadOnly = session.role === 'READ_ONLY'

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={control}
                name="assignDate"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="uppercase text-xs text-muted-foreground">Assign Date</FormLabel>
                        <FormControl>
                            <Input
                                type="date"
                                disabled={isReadOnly}
                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(e.target.value)} // Let z.coerce.date handle the string
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="dueDate"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="uppercase text-xs text-muted-foreground">Due Date</FormLabel>
                        <FormControl>
                            <Input
                                type="date"
                                disabled={isReadOnly}
                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(e.target.value)}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}
