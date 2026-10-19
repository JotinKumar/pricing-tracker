'use client'

import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActivityFormValues } from '@/lib/schemas'
import { SectionProps, renderOptions } from './shared'

export function FinancialDetails({ lookups, session }: SectionProps) {
    const { control } = useFormContext<ActivityFormValues>()
    const isReadOnly = session.role === 'READ_ONLY'

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="uppercase text-xs text-muted-foreground">Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {renderOptions(lookups.categories)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="annualContractValue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="uppercase text-xs text-muted-foreground">ACV</FormLabel>
                            <FormControl>
                                <Input {...field} type="number" disabled={isReadOnly} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={control}
                    name="tcv"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="uppercase text-xs text-muted-foreground">TCV</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    disabled={isReadOnly}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                    placeholder="Total Contract Value"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="dealDuration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="uppercase text-xs text-muted-foreground">Deal Duration (months)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    disabled={isReadOnly}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                    placeholder="Duration in months"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}
