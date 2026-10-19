'use client'

import { useState, useEffect, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { toast } from "sonner"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActivityFormValues } from '@/lib/schemas'
import { getFieldConfigs } from '@/lib/actions/field-config'
import { SectionProps, renderOptions } from './shared'
import { ClientCombobox } from '../client-combobox'

type FieldConfig = {
    fieldName: string
    fieldType: string
    prefix?: string | null
    hasPrefix?: boolean
    isActive?: boolean
}

export function PrimaryDetails({ lookups, session, clientNames = [] }: SectionProps) {
    const { control, watch, setValue } = useFormContext<ActivityFormValues>()
    const isReadOnly = session.role === 'READ_ONLY'

    const [configs, setConfigs] = useState<Record<string, FieldConfig>>({
        id1: { fieldName: 'ID1', fieldType: 'STRING', prefix: '', isActive: true },
        id2: { fieldName: 'ID2', fieldType: 'STRING', prefix: '', isActive: true }
    })

    useEffect(() => {
        getFieldConfigs().then(res => {
            if (res.success && res.data) {
                const map: Record<string, FieldConfig> = {}
                res.data.forEach((c) => map[c.targetField] = c)
                setConfigs(prev => ({ ...prev, ...map }))
            }
        })
    }, [])

    const watchedVerticalId = watch('verticalId')

    // Subvertical options for the selected vertical
    const subverticalOptions = useMemo(() => {
        const all = lookups.subverticals || []
        if (!watchedVerticalId) return []
        return all.filter((s) => String(s.verticalId) === String(watchedVerticalId))
    }, [lookups.subverticals, watchedVerticalId])

    // Reset subverticalId when the vertical changes and the current subvertical
    // no longer belongs to the selected vertical.
    useEffect(() => {
        const currentSubId = watch('subverticalId')
        if (!currentSubId) return
        const stillValid = subverticalOptions.some((s) => String(s.id) === String(currentSubId))
        if (!stillValid) {
            setValue('subverticalId', undefined, { shouldDirty: true })
        }
    }, [subverticalOptions, watch, setValue])

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Dynamically Configured ID1 */}
                {configs.id1.isActive !== false && (
                    <div className="flex items-end gap-2">
                        <FormField
                            control={control}
                            name="id1"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className="uppercase text-xs text-muted-foreground">{configs.id1.fieldName || 'ID1'}</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            {configs.id1.hasPrefix && configs.id1.prefix && (
                                                <div className="absolute left-3 top-2.5 text-sm text-muted-foreground select-none">
                                                    {configs.id1.prefix}
                                                </div>
                                            )}
                                            <Input
                                                {...field}
                                                type={configs.id1.fieldType === 'NUMBER' ? 'number' : 'text'}
                                                disabled={isReadOnly}
                                                placeholder={configs.id1.fieldName || 'ID1'}
                                                className={configs.id1.hasPrefix && configs.id1.prefix ? "pl-10" : ""}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <button
                            type="button"
                            className="h-10 px-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 flex items-center justify-center mb-0.5"
                            onClick={() => toast.info("API Fetch Placeholder")}
                            title={`Fetch ${configs.id1.fieldName || 'ID1'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
                        </button>
                    </div>
                )}

                {/* Dynamically Configured ID2 */}
                {configs.id2.isActive !== false && (
                    <div className="flex items-end gap-2">
                        <FormField
                            control={control}
                            name="id2"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className="uppercase text-xs text-muted-foreground">{configs.id2.fieldName || 'ID2'}</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            {configs.id2.hasPrefix && configs.id2.prefix && (
                                                <div className="absolute left-3 top-2.5 text-sm text-muted-foreground select-none">
                                                    {configs.id2.prefix}
                                                </div>
                                            )}
                                            <Input
                                                {...field}
                                                type={configs.id2.fieldType === 'NUMBER' ? 'number' : 'text'}
                                                disabled={isReadOnly}
                                                placeholder={configs.id2.fieldName || 'ID2'}
                                                className={configs.id2.hasPrefix && configs.id2.prefix ? "pl-12" : ""}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <button
                            type="button"
                            className="h-10 px-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 flex items-center justify-center mb-0.5"
                            onClick={() => toast.info("API Fetch Placeholder")}
                            title={`Fetch ${configs.id2.fieldName || 'ID2'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FormField
                    control={control}
                    name="clientName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="uppercase text-xs text-muted-foreground">Client Name</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        {...field}
                                        disabled={isReadOnly}
                                        list="clientLinks"
                                        placeholder="Select or enter client name"
                                        autoComplete="off"
                                        className="hidden" // Keep hidden input for form linkage if needed, or just replace
                                    />
                                    <ClientCombobox
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={clientNames}
                                        disabled={isReadOnly}
                                    />

                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="projectName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="uppercase text-xs text-muted-foreground">Project Name</FormLabel>
                            <FormControl>
                                <Input {...field} disabled={isReadOnly} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className={subverticalOptions.length > 0 ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                <FormField
                    control={control}
                    name="verticalId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="uppercase text-xs text-muted-foreground">Vertical</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Vertical" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {renderOptions(lookups.verticals)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {subverticalOptions.length > 0 && (
                    <FormField
                        control={control}
                        name="subverticalId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="uppercase text-xs text-muted-foreground">Sub-Vertical</FormLabel>
                                <Select
                                    value={field.value ?? ''}
                                    onValueChange={field.onChange}
                                    disabled={isReadOnly}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Sub-Vertical" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {subverticalOptions.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.subvertical}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={control}
                    name="horizontalId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="uppercase text-xs text-muted-foreground">Horizontal</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Horizontal" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {renderOptions(lookups.horizontals)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </>
    )
}
