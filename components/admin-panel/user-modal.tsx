'use client'

import { X, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ConfirmationDialog } from './confirmation-dialog'
import { ApiResponse, Team } from '@/types'
import { useUserForm, UserFormValues } from '@/hooks/use-user-form'
import { AvatarUploader } from '@/components/ui/avatar-uploader'

interface UserModalProps {
    editItem: UserFormValues | null
    handleSave: (data: UserFormValues) => Promise<ApiResponse>
    onClose: () => void
    data: UserFormValues[]
    availableTeams: Team[]
}

export function UserModal({ editItem, handleSave, onClose, data, availableTeams }: UserModalProps) {
    const {
        form,
        showConfirm,
        setShowConfirm,
        confirmType,
        handleConfirmProceed,
        onSubmit
    } = useUserForm({ editItem, handleSave, availableTeams })

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

                        <FormField
                            control={form.control}
                            name="avatar"
                            render={({ field }) => (
                                <AvatarUploader
                                    avatarUrl={field.value}
                                    initials={form.watch('initials')}
                                    firstName={form.watch('firstName')}
                                    onAvatarChange={field.onChange}
                                />
                            )}
                        />

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
