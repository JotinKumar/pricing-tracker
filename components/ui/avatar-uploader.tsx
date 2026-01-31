'use client'

import { useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Removed Form components to allow usage without FormContext

interface AvatarUploaderProps {
    avatarUrl?: string
    initials?: string
    firstName?: string
    onAvatarChange: (value: string) => void
}

export function AvatarUploader({ avatarUrl, initials, firstName, onAvatarChange }: AvatarUploaderProps) {
    return (
        <div className="flex flex-col items-center justify-center pb-6 -mt-2">
            <Popover>
                <PopoverTrigger asChild>
                    <div className="relative group cursor-pointer">
                        {/* Gradient Ring */}
                        <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 via-green-500 to-yellow-500 rounded-full opacity-80 blur-[1px] group-hover:opacity-100 transition duration-500"></div>

                        {/* Avatar */}
                        <Avatar className="w-24 h-24 border-4 border-background relative shadow-lg">
                            <AvatarImage src={avatarUrl} className="object-cover" />
                            <AvatarFallback className="text-3xl font-bold bg-muted text-muted-foreground">
                                {initials || '?'}
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
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Image Source</Label>
                            <div>
                                <div className="space-y-3">
                                    <Input
                                        value={avatarUrl || ''}
                                        onChange={(e) => onAvatarChange(e.target.value)}
                                        placeholder="Paste Image URL..."
                                        className="h-9"
                                    />

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
                                                            onAvatarChange(reader.result as string)
                                                        }
                                                        reader.readAsDataURL(file)
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <div className="text-center mt-4">
                <h2 className="text-xl font-semibold text-foreground">
                    Hi, {firstName || 'User'}!
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your profile details</p>
            </div>
        </div>
    )
}
