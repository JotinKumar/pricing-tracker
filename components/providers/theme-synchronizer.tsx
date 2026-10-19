"use client"

import { useTheme } from "next-themes"
import { useEffect, useRef } from "react"

export function ThemeSynchronizer({ userTheme }: { userTheme?: string | null }) {
    const { theme, setTheme } = useTheme()
    const mounted = useRef(false)

    useEffect(() => {
        // Only run on mount to sync DB preference to client
        if (!mounted.current && userTheme && userTheme !== theme) {
            setTheme(userTheme)
            mounted.current = true
        }
    }, [userTheme, theme, setTheme])

    return null
}
