'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { ApiResponse, AdminLookupFormValues } from '@/types'

interface LookupModalProps {
  editItem: AdminLookupFormValues | null
  activeTab: string
  fields: { key: string; label: string }
  handleSave: (data: AdminLookupFormValues) => Promise<ApiResponse>
  onClose: () => void
  data: AdminLookupFormValues[]
  defaultCurrency?: string
}

export function LookupModal({
  editItem,
  activeTab,
  fields,
  handleSave,
  onClose,
  data,
  defaultCurrency = '$'
}: LookupModalProps) {
  const getDefaultValues = (): AdminLookupFormValues => {
    const values: AdminLookupFormValues = {
      id: editItem?.id,
      display: editItem?.display || '',
      isActive: editItem?.isActive ?? true,
      currency: activeTab === 'Location' ? editItem?.currency || defaultCurrency : defaultCurrency
    }
    values[fields.key] = editItem?.[fields.key] || ''
    return values
  }

  const form = useForm<AdminLookupFormValues>({
    defaultValues: getDefaultValues()
  })

  const lookupValue = form.watch(fields.key)
  const displayValue = form.watch('display')

  useEffect(() => {
    if (!lookupValue) return
    const cleanVal = String(lookupValue).trim()
    if (!cleanVal) return

    let candidate = cleanVal.substring(0, 2).toUpperCase()
    const isCollision = (val: string) =>
      data.some((item) => item.id !== editItem?.id && item.display === val)

    if (isCollision(candidate)) {
      candidate = cleanVal.substring(0, 3).toUpperCase()
    }

    if (candidate !== displayValue) {
      form.setValue('display', candidate, { shouldValidate: true })
    }
  }, [lookupValue, data, editItem, form, displayValue])

  useEffect(() => {
    form.reset(getDefaultValues())
  }, [editItem, activeTab, form])

  const onSubmit = async (formData: AdminLookupFormValues) => {
    const res = await handleSave(formData)
    if (res && !res.success && res.errors) {
      Object.entries(res.errors).forEach(([key, message]) => {
        form.setError(key as Extract<keyof AdminLookupFormValues, string>, {
          type: 'manual',
          message: message as string
        })
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 slide-in-from-bottom-5">
        <div className="px-8 py-5 flex justify-between items-center bg-muted/40 sticky top-0 backdrop-blur-md z-10 border-b border-white/5">
          <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              {editItem ? 'Edit' : 'Create'} {activeTab}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Fill in the details below</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-background/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-5">
            <div className="space-y-5">
              <FormField
                control={form.control}
                name={fields.key}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {fields.label}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={String(field.value || '')}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder={`Enter ${fields.label.toLowerCase()}`}
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {activeTab === 'Location' && (
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Currency
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={String(field.value || defaultCurrency)}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="e.g. USD ($)"
                          className="h-10 font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="display"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Display Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={String(field.value || '')}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="e.g. Code"
                        className="h-10 font-mono text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-lg bg-muted/20">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-semibold cursor-pointer text-foreground">
                      Active Status
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Inactive items won't appear in dropdowns
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 font-bold shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40"
              >
                {editItem ? 'Update Changes' : 'Create Record'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
