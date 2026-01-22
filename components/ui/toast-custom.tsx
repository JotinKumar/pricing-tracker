'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
    id: string
    type: ToastType
    message: string
    title?: string
    duration?: number
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { ...toast, id }

        setToasts((prev) => [...prev, newToast])

        if (toast.duration !== 0) {
            setTimeout(() => {
                removeToast(id)
            }, toast.duration || 4000)
        }
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto min-w-[300px] max-w-sm rounded-lg shadow-lg border p-4 flex gap-3 items-start transform transition-all duration-300 animate-in slide-in-from-right-full fade-in",
                            toast.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
                                toast.type === 'error' ? "bg-red-50 border-red-200 text-red-900" :
                                    toast.type === 'warning' ? "bg-amber-50 border-amber-200 text-amber-900" :
                                        "bg-blue-50 border-blue-200 text-blue-900"
                        )}
                    >
                        <div className="mt-0.5 shrink-0">
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div className="flex-1 space-y-1">
                            {toast.title && <h4 className="font-semibold text-sm">{toast.title}</h4>}
                            <p className="text-sm opacity-90">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors opacity-70 hover:opacity-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
