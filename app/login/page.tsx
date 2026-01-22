'use client'

import { useState } from 'react'
import { login } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string>('')
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            const result = await login(userId) // userId here is effectively email
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
        <div className="flex h-screen items-center justify-center bg-background transition-colors duration-300">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <img src="/logo.png" alt="Logo" className="h-12 w-12 object-contain" />
                    </div>
                    <CardTitle className="text-center text-2xl font-bold">
                        <span style={{ color: '#0D47A1' }}>Pricing</span><span style={{ color: '#E91E63' }}>Tracker</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email Address</label>
                            <Input
                                type="text"
                                id="email"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="e.g., admin@example.com"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full font-bold">
                            Login
                        </Button>
                    </form>
                    <div className="mt-6 text-xs text-muted-foreground">
                        <p className="font-semibold mb-1">Demo Users:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                            <li>admin@example.com</li>
                            <li>manager@example.com</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
