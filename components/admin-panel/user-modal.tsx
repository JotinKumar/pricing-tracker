'use client'

import { X, ChevronDown, Check, Camera, Upload } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminUserSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ConfirmationDialog } from './confirmation-dialog'
import { ApiResponse, Team } from '@/types'
import * as z from 'zod'

// Form values type with required fields for the form
interface UserFormValues {
    id?: number
    email: string
    name?: string
    firstName?: string
    lastName?: string
    initials?: string
    designation?: string
    avatar?: string
    managerId?: number
    role: 'USER' | 'MANAGER' | 'ADMIN' | 'READ_ONLY'
    teams: number[]
    isActive: boolean
}

interface UserModalProps {
    editItem: UserFormValues | null
    handleSave: (data: UserFormValues) => Promise<ApiResponse>
    onClose: () => void
    data: UserFormValues[]
    availableTeams: Team[]
}

export function UserModal({ editItem, handleSave, onClose, data, availableTeams }: UserModalProps) {
    const getNameParts = (fullName: string) => {
        if (!fullName) return { first: '', last: '' }
        const parts = fullName.split(' ')
        if (parts.length === 1) return { first: parts[0], last: '' }
        return { first: parts[0], last: parts.slice(1).join(' ') }
    }

    const { first, last } = getNameParts(editItem?.name || '')

    const defaultValues: UserFormValues = {
        id: editItem?.id,
        email: editItem?.email || '',
        firstName: editItem ? first : '',
        lastName: editItem ? last : '',
        initials: editItem?.initials || '',
        designation: editItem?.designation || '',
        avatar: editItem?.avatar || '',
        managerId: editItem?.managerId,
        role: editItem?.role || 'READ_ONLY',
        teams: editItem?.teams || [],
        isActive: editItem?.isActive ?? true
    }

    const form = useForm<UserFormValues>({
        resolver: zodResolver(adminUserSchema) as any,
        defaultValues
    })

    // Watch fields for auto-generation
    const firstName = form.watch('firstName')
    const lastName = form.watch('lastName')

    // Auto-generate Initials from first and last name
    useEffect(() => {
        const f = firstName || ''
        const l = lastName || ''
        let generated = ''
        if (f && l) generated = (f[0] + l[0]).toUpperCase()
        else if (f) generated = f.substring(0, 2).toUpperCase()

        if (generated) form.setValue('initials', generated, { shouldValidate: true })
    }, [firstName, lastName, form])

    const [pendingData, setPendingData] = useState<UserFormValues | null>(null)
    const [showConfirm, setShowConfirm] = useState(false)
    const [confirmType, setConfirmType] = useState<'missing_info' | 'disable_user'>('missing_info')

    const onSubmit = async (data: UserFormValues) => {
        const hasManager = data.managerId && data.managerId !== 0
        const hasTeams = data.teams && data.teams.length > 0
        const isDisabling = editItem?.isActive && !data.isActive

        if (isDisabling) {
            setPendingData(data)
            setConfirmType('disable_user')
            setShowConfirm(true)
            return
        }

        // Validation check for missing fields
        if ((!hasManager || !hasTeams) && !editItem?.id) {
            setPendingData(data)
            setConfirmType('missing_info')
            setShowConfirm(true)
            return
        } else if (!hasManager || !hasTeams) {
            setPendingData(data)
            setConfirmType('missing_info')
            setShowConfirm(true)
            return
        }
        
        data.name = `${data.firstName} ${data.lastName || ''}`.trim()

        // Direct save if no warning needed
        await processSave(data)
    }

    const processSave = async (data: UserFormValues) => {
        const res = await handleSave(data)
        if (res && !res.success && res.errors) {
            Object.entries(res.errors).forEach(([key, message]) => {
                form.setError(key as keyof UserFormValues, { type: 'manual', message: message as string })
            })
        }
    }

    const handleConfirmProceed = async () => {
        setShowConfirm(false)
        if (pendingData) {
            const finalData = { ...pendingData }
            finalData.name = `${finalData.firstName} ${finalData.lastName || ''}`.trim()
            await processSave(finalData)
            setPendingData(null)
        }
    }

    useEffect(() => { form.reset(defaultValues) }, [editItem])

    const avatarInputRef = useRef<HTMLInputElement>(null)

    const getDialogContent = () => {
        if (confirmType === 'disable_user') {
            return {
                title: 'Confirm Deactivation',
                message: 'Are you sure you want to disable this user? They will no longer be able to log in or access the system.',
                confirmLabel: 'Yes, Disable User'
            }
        }
        return {
            title: 'Potential Missing Information',
            message: 'You have not assigned a Manager or Teams to this user. This might limit their visibility or access. Do you want to proceed anyway?',
            confirmLabel: editItem ? 'Yes, Update User' : 'Yes, Create User'
        }
    }

    const dialogContent = getDialogContent()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 slide-in-from-bottom-5">
                <div className="px-8 py-5 flex justify-between items-center bg-muted/40 sticky top-0 backdrop-blur-md z-10 border-b border-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">{editItem ? 'Edit' : 'Create'} User</h3>
                        <p className="text-xs text-muted-foreground mt-1">Fill in the details below</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full bg-background/50 hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-5">
                        <div className="flex flex-col items-center justify-center pb-6 -mt-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="relative group cursor-pointer">
                                        {/* Gradient Ring */}
                                        <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 via-green-500 to-yellow-500 rounded-full opacity-80 blur-[1px] group-hover:opacity-100 transition duration-500"></div>

                                        {/* Avatar */}
                                        <Avatar className="w-24 h-24 border-4 border-background relative shadow-lg">
                                            <AvatarImage src={form.watch('avatar')} className="object-cover" />
                                            <AvatarFallback className="text-3xl font-bold bg-muted text-muted-foreground">
                                                {form.watch('initials') || '?'}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Camera Badge */}
                                        <div className="absolute bottom-0 right-0 bg-background p-1.5 rounded-full shadow-md border border-border/50 group-hover:scale-110 transition-transform">
                                            <div className="bg-primary/10 p-1.5 rounded-full text-primary">
                                                <Camera className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4" align="center">
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="avatar"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Image Source</FormLabel>
                                                    <FormControl>
                                                        <div className="space-y-3">
                                                            <Input {...field} value={field.value || ''} placeholder="Paste Image URL..." className="h-9" />

                                                            <div className="relative">
                                                                <div className="absolute inset-0 flex items-center">
                                                                    <span className="w-full border-t border-border/50" />
                                                                </div>
                                                                <div className="relative flex justify-center text-[10px] uppercase">
                                                                    <span className="bg-popover px-2 text-muted-foreground">Or upload</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-center w-full">
                                                                <label htmlFor="avatar-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/25">
                                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                        <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                                                        <p className="text-[10px] text-muted-foreground">Click to upload image</p>
                                                                    </div>
                                                                    <input
                                                                        id="avatar-upload"
                                                                        type="file"
                                                                        className="hidden"
                                                                        accept="image/*"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0]
                                                                            if (file) {
                                                                                const reader = new FileReader()
                                                                                reader.onloadend = () => {
                                                                                    form.setValue('avatar', reader.result as string)
                                                                                }
                                                                                reader.readAsDataURL(file)
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <div className="text-center mt-4">
                                <h2 className="text-xl font-semibold text-foreground">
                                    Hi, {form.watch('firstName') || 'User'}!
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Manage your profile details</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" placeholder="user@example.com" className="h-10" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">First Name</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} className="h-10" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Name</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} className="h-10" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="initials"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Initials</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} className="h-10 font-mono" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="managerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Manager</FormLabel>
                                            <Select 
                                                onValueChange={(value) => field.onChange(value === '0' ? undefined : parseInt(value))} 
                                                value={field.value ? String(field.value) : '0'}
                                            >
                                                <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select Manager" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="0">None</SelectItem>
                                                    {data.filter((u) => u.id !== editItem?.id).map((u) => (
                                                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="designation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Designation</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="Role Title" className="h-10" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Role" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="USER">USER</SelectItem>
                                                    <SelectItem value="MANAGER">MANAGER</SelectItem>
                                                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                                                    <SelectItem value="READ_ONLY">READ_ONLY</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="teams"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Teams</FormLabel>
                                        <FormControl>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div className="w-full rounded-md bg-background px-3 h-10 py-2 text-sm ring-offset-background flex justify-between items-center cursor-pointer hover:bg-muted/50 transition">
                                                        <span className="truncate">
                                                            {field.value?.length > 0
                                                                ? availableTeams.filter(t => field.value.includes(t.id)).map(t => t.teamname).join(', ')
                                                                : <span className="text-muted-foreground">Select Teams...</span>}
                                                        </span>
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1 max-h-60 overflow-y-auto" align="start">
                                                    {availableTeams.map(team => {
                                                        const isSelected = field.value?.includes(team.id)
                                                        return (
                                                            <div
                                                                key={team.id}
                                                                className={`flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer text-sm transition-colors ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                                                                onClick={() => {
                                                                    const current = field.value || []
                                                                    const next = isSelected ? current.filter((id) => id !== team.id) : [...current, team.id]
                                                                    field.onChange(next)
                                                                }}
                                                            >
                                                                <span>{team.teamname} <span className="text-xs text-muted-foreground ml-1">({team.display})</span></span>
                                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                                            </div>
                                                        )
                                                    })}
                                                </PopoverContent>
                                            </Popover>
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
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="h-4 w-4 rounded text-primary focus:ring-primary"
                                        />
                                    </FormControl>
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm font-semibold cursor-pointer text-foreground">
                                            Active Status
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">Inactive items won't appear in dropdowns</p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <div className="pt-2 flex gap-3">
                            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 font-semibold text-muted-foreground hover:text-foreground">Cancel</Button>
                            <Button type="submit" className="flex-1 h-11 font-bold shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40">
                                {editItem ? 'Update Changes' : 'Create Record'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>

            <ConfirmationDialog
                isOpen={showConfirm}
                title={dialogContent.title}
                message={dialogContent.message}
                confirmLabel={dialogContent.confirmLabel}
                cancelLabel="Back to Edit"
                onConfirm={handleConfirmProceed}
                onCancel={() => setShowConfirm(false)}
            />
        </div>
    )
}
