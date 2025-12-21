"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggle() {
    const { setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch by only rendering after mount
    React.useEffect(() => {
        setMounted(true)
    }, [])

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    // Show a placeholder during SSR to prevent hydration mismatch
    if (!mounted) {
        return (
            <button
                className="relative h-7 w-14 rounded-full bg-muted"
                aria-label="Toggle theme"
            />
        )
    }

    const isDark = resolvedTheme === "dark"

    return (
        <button
            onClick={toggleTheme}
            className={`
                relative h-7 w-14 rounded-full 
                transition-colors duration-300 ease-in-out
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${isDark
                    ? "bg-primary/20"
                    : "bg-card"
                }
            `}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            role="switch"
            aria-checked={isDark}
        >
            {/* Icons fixed in the track background */}
            <span className="absolute inset-0 flex items-center justify-between px-1.5">
                {/* Sun icon on the right side */}
                <Sun className="h-4 w-4 text-amber-500" />
                {/* Moon icon on the left side */}
                <Moon className="h-4 w-4 text-slate-300" />                
            </span>

            {/* Sliding circle knob */}
            <span
                className={`
                    absolute top-0.5 h-6 w-6 rounded-full
                    bg-primary/50 shadow-md
                    transition-all duration-300 ease-in-out
                    ${isDark
                        ? "left-0.5"
                        : "left-[calc(100%-1.625rem)]"
                    }
                `}
            />
        </button>
    )
}
