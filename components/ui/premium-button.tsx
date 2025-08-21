"use client"

import { cn } from "@/lib/utils"
import { forwardRef } from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "outline" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

const PremiumButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          // Base styles
          "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink-400 disabled:pointer-events-none disabled:opacity-50",
          // Premium shadow and hover effects
          "shadow-sm hover:shadow-premium active:scale-[0.98]",
          {
            // Default variant (primary)
            "default": "bg-ink-900 text-white hover:bg-ink-800 shadow-premium hover:shadow-premium-lg",
            // Outline variant
            "outline": "border border-ink-200 bg-white hover:bg-ink-50 hover:border-ink-300 text-ink-900",
            // Ghost variant
            "ghost": "text-ink-900 hover:bg-ink-50",
            // Link variant
            "link": "text-ink-900 underline-offset-4 hover:underline",
            // Destructive variant
            "destructive": "bg-red-600 text-white hover:bg-red-700",
          }[variant],
          {
            // Size variants
            "default": "h-11 px-6 py-2",
            "sm": "h-9 rounded-xl px-4",
            "lg": "h-12 rounded-2xl px-8",
            "icon": "h-11 w-11",
          }[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
PremiumButton.displayName = "PremiumButton"

export { PremiumButton }