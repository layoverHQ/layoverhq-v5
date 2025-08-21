/**
 * Enterprise Button Component
 *
 * Based on research of top OTA platforms and modern interaction patterns.
 * Features:
 * - Multiple variants for different contexts
 * - Proper accessibility support (WCAG 2.1 AA)
 * - Loading states and icons
 * - Touch-friendly sizing (44px minimum)
 * - Performance optimized
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap font-medium",
    "transition-all duration-200 ease-in-out",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none", // Prevent text selection

    // Minimum touch target (44px for accessibility)
    "min-h-[44px] min-w-[44px]",

    // Icon sizing
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Primary - Main CTAs (book flights, search, etc.)
        primary: [
          "bg-blue-500 text-white shadow-sm",
          "hover:bg-blue-600 active:bg-blue-700",
          "focus-visible:ring-blue-500",
          "dark:bg-blue-600 dark:hover:bg-blue-700",
        ],

        // Secondary - Secondary actions
        secondary: [
          "bg-white text-neutral-700 border border-neutral-300 shadow-xs",
          "hover:bg-neutral-50 active:bg-neutral-100",
          "focus-visible:ring-neutral-500",
          "dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-600",
          "dark:hover:bg-neutral-700 dark:active:bg-neutral-600",
        ],

        // Outline - Less prominent actions
        outline: [
          "border border-blue-500 text-blue-600 bg-transparent",
          "hover:bg-blue-50 active:bg-blue-100",
          "focus-visible:ring-blue-500",
          "dark:border-blue-400 dark:text-blue-400",
          "dark:hover:bg-blue-950/20 dark:active:bg-blue-950/30",
        ],

        // Ghost - Minimal actions
        ghost: [
          "text-neutral-600 bg-transparent",
          "hover:bg-neutral-100 active:bg-neutral-200",
          "focus-visible:ring-neutral-500",
          "dark:text-neutral-300 dark:hover:bg-neutral-800 dark:active:bg-neutral-700",
        ],

        // Destructive - Delete, cancel actions
        destructive: [
          "bg-error-500 text-white shadow-sm",
          "hover:bg-error-600 active:bg-error-700",
          "focus-visible:ring-error-500",
        ],

        // Travel-specific variants
        airline: [
          "bg-blue-700 text-white shadow-sm",
          "hover:opacity-90 active:opacity-80",
          "focus-visible:ring-blue-500",
        ],

        hotel: [
          "bg-green-600 text-white shadow-sm",
          "hover:opacity-90 active:opacity-80",
          "focus-visible:ring-green-500",
        ],

        experience: [
          "bg-purple-600 text-white shadow-sm",
          "hover:opacity-90 active:opacity-80",
          "focus-visible:ring-purple-500",
        ],
      },

      size: {
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-10 px-4 text-sm rounded-lg", // Default
        lg: "h-12 px-6 text-base rounded-lg",
        xl: "h-14 px-8 text-lg rounded-xl",
        icon: "size-10 rounded-lg", // Square icon button
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12 rounded-lg",
      },

      width: {
        auto: "w-auto",
        full: "w-full",
        fit: "w-fit",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      width: "auto",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      width,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button"

    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, width, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </Comp>
    )
  },
)
Button.displayName = "Button"

// Specialized button components for common travel actions
export const SearchButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
  (props, ref) => (
    <Button ref={ref} variant="primary" {...props}>
      Search Flights
    </Button>
  ),
)
SearchButton.displayName = "SearchButton"

export const BookButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
  (props, ref) => (
    <Button ref={ref} variant="airline" {...props}>
      Book Now
    </Button>
  ),
)
BookButton.displayName = "BookButton"

export const ViewExperiencesButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "variant">
>((props, ref) => (
  <Button ref={ref} variant="experience" {...props}>
    View Experiences
  </Button>
))
ViewExperiencesButton.displayName = "ViewExperiencesButton"

// Named exports for compatibility
export const EnterpriseButton = Button
export const EnterpriseSearchButton = SearchButton
export const EnterpriseBookButton = BookButton
export const EnterpriseViewExperiencesButton = ViewExperiencesButton

// Default exports (without duplicates)
export { Button, buttonVariants }
