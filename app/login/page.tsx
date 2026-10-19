'use client'

import { useState } from 'react'
import { login } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState<string>('')
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            const result = await login(email)
            if (result.success) {
                router.push('/dashboard')
            } else {
                setError(result.message || 'Login failed')
            }
        } catch (err) {
            setError('Login failed')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm border-border shadow-sm">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto flex items-center justify-center w-11 h-11 rounded-lg border border-border bg-background overflow-hidden p-1">
                        <img src="/logo.png" alt="Pricing Tracker" className="h-full w-full object-contain" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">
                            <span className="text-primary">Pricing</span>Tracker
                        </h1>
                        <p className="text-xs text-muted-foreground">Sign in to manage your pricing activities</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs text-muted-foreground">Email Address</Label>
                            <Input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                                className="h-10"
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full h-10 font-medium">
                            Sign in
                        </Button>
                    </form>
                    <div className="rounded-md border border-border bg-muted/40 p-3">
                        <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Demo accounts</p>
                        <ul className="text-[11px] text-muted-foreground space-y-0.5 font-mono">
                            <li>admin@example.com</li>
                            <li>manager@example.com</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
