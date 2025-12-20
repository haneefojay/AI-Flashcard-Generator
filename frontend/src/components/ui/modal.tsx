"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { X, AlertTriangle, Info, CheckCircle, HelpCircle } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    children?: React.ReactNode
    type?: "info" | "warning" | "danger" | "success" | "confirm"
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    type = "info",
    confirmText = "Continue",
    cancelText = "Cancel",
    onConfirm,
}: ModalProps) {
    const [isRendered, setIsRendered] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true)
            document.body.style.overflow = "hidden"
        } else {
            const timer = setTimeout(() => {
                setIsRendered(false)
                document.body.style.overflow = "unset"
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isRendered) return null

    const getIcon = () => {
        switch (type) {
            case "danger":
            case "warning":
                return <AlertTriangle className={cn("h-6 w-6", type === "danger" ? "text-red-500" : "text-amber-500")} />
            case "success":
                return <CheckCircle className="h-6 w-6 text-green-500" />
            case "confirm":
                return <HelpCircle className="h-6 w-6 text-primary" />
            default:
                return <Info className="h-6 w-6 text-blue-500" />
        }
    }

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
                isOpen ? "opacity-100" : "opacity-0",
            )}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onConfirm ? undefined : onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full max-w-md bg-background rounded-xl shadow-2xl border border-border overflow-hidden transition-all duration-200 transform",
                    isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4",
                )}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "p-2 rounded-full shrink-0",
                            type === "danger" ? "bg-red-50" :
                                type === "warning" ? "bg-amber-50" :
                                    type === "success" ? "bg-green-50" :
                                        "bg-blue-50"
                        )}>
                            {getIcon()}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                            <h3 className="text-lg font-bold text-foreground leading-tight">
                                {title}
                            </h3>
                            {description && (
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    {description}
                                </p>
                            )}
                            {children && <div className="mt-4">{children}</div>}
                        </div>

                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={onClose}>
                            {cancelText}
                        </Button>
                        <Button
                            variant={type === "danger" ? "destructive" : "default"}
                            onClick={() => {
                                if (onConfirm) onConfirm()
                                else onClose()
                            }}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
