"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "search" | "minimal"
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const PremiumInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            // Base styles
            "flex h-11 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition-all duration-200",
            "focus:border-ink-400 focus:outline-none focus:ring-1 focus:ring-ink-400/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            {
              // Default variant
              "default": "shadow-sm hover:border-ink-300 hover:shadow-premium",
              // Search variant (larger, more prominent)
              "search": "h-12 rounded-2xl shadow-premium hover:shadow-premium-lg focus:shadow-premium-lg",
              // Minimal variant (no border, subtle background)
              "minimal": "border-transparent bg-ink-50 hover:bg-ink-100 focus:bg-white focus:border-ink-200",
            }[variant],
            // Icon padding
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
PremiumInput.displayName = "PremiumInput"

export { PremiumInput }