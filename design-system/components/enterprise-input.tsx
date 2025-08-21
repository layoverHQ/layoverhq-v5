/**
 * Enterprise Input Component
 *
 * Based on research of top OTA platforms and accessibility best practices.
 * Features:
 * - Multiple variants for different contexts
 * - Comprehensive validation states
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Travel-specific input types (airport codes, dates, etc.)
 * - Performance optimized
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Search, Calendar, MapPin, Plane, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  [
    // Base styles
    "flex w-full border bg-background text-foreground",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-muted-foreground",
    "transition-all duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",

    // Minimum accessible sizing
    "min-h-[44px]",
  ],
  {
    variants: {
      variant: {
        // Default input styling
        default: [
          "border-neutral-300 dark:border-neutral-600",
          "focus-visible:ring-blue-500 focus-visible:border-blue-500",
          "hover:border-neutral-400 dark:hover:border-neutral-500",
        ],

        // Search inputs
        search: [
          "border-blue-300 dark:border-blue-700",
          "bg-blue-50/50 dark:bg-blue-950/20",
          "focus-visible:ring-blue-500 focus-visible:border-blue-500",
          "placeholder:text-blue-600/60 dark:placeholder:text-blue-400/60",
        ],

        // Date inputs
        date: [
          "border-secondary-300 dark:border-secondary-700",
          "focus-visible:ring-secondary-500 focus-visible:border-secondary-500",
        ],

        // Location/airport inputs
        location: [
          "border-success-300 dark:border-success-700",
          "focus-visible:ring-success-500 focus-visible:border-success-500",
        ],

        // Error state
        error: [
          "border-error-500 dark:border-error-400",
          "bg-error-50/50 dark:bg-error-950/20",
          "focus-visible:ring-error-500 focus-visible:border-error-500",
          "placeholder:text-error-600/60 dark:placeholder:text-error-400/60",
        ],

        // Success state
        success: [
          "border-success-500 dark:border-success-400",
          "bg-success-50/50 dark:bg-success-950/20",
          "focus-visible:ring-success-500 focus-visible:border-success-500",
        ],

        // Minimal styling
        minimal: [
          "border-transparent bg-transparent",
          "focus-visible:ring-blue-500 focus-visible:border-blue-500",
          "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
        ],
      },

      size: {
        sm: "h-8 px-3 py-1 text-sm rounded-md",
        md: "h-10 px-4 py-2 text-sm rounded-lg", // Default
        lg: "h-12 px-4 py-3 text-base rounded-lg",
        xl: "h-14 px-6 py-4 text-lg rounded-xl",
      },

      width: {
        auto: "w-auto",
        full: "w-full",
        fit: "w-fit",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      width: "full",
    },
  },
)

const inputWrapperVariants = cva("relative flex items-center")

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "width">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: boolean
  success?: boolean
  helpText?: string
  label?: string
  required?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      width,
      type = "text",
      leftIcon,
      rightIcon,
      error,
      success,
      helpText,
      label,
      required,
      id,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const inputId = id || React.useId()

    // Determine variant based on props
    const finalVariant = error ? "error" : success ? "success" : variant
    const isPassword = type === "password"
    const inputType = isPassword ? (showPassword ? "text" : "password") : type

    const inputElement = (
      <div className={cn(inputWrapperVariants())}>
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          type={inputType}
          id={inputId}
          className={cn(
            inputVariants({ variant: finalVariant, size, width }),
            leftIcon && "pl-10",
            (rightIcon || isPassword) && "pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />

        {(rightIcon || isPassword) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            ) : (
              <div className="text-muted-foreground pointer-events-none">{rightIcon}</div>
            )}
          </div>
        )}
      </div>
    )

    if (label || helpText) {
      return (
        <div className="space-y-2">
          {label && (
            <label htmlFor={inputId} className="text-sm font-medium text-foreground">
              {label}
              {required && <span className="text-error-500 ml-1">*</span>}
            </label>
          )}
          {inputElement}
          {helpText && (
            <p
              className={cn(
                "text-xs",
                error
                  ? "text-error-600 dark:text-error-400"
                  : success
                    ? "text-success-600 dark:text-success-400"
                    : "text-muted-foreground",
              )}
            >
              {helpText}
            </p>
          )}
        </div>
      )
    }

    return inputElement
  },
)
Input.displayName = "Input"

// Specialized input components for travel contexts

export interface SearchInputProps extends Omit<InputProps, "variant" | "leftIcon"> {
  searchType?: "flights" | "hotels" | "experiences" | "general"
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ searchType = "general", placeholder, ...props }, ref) => {
    const getPlaceholder = () => {
      switch (searchType) {
        case "flights":
          return "Search flights, airlines, routes..."
        case "hotels":
          return "Search hotels, destinations..."
        case "experiences":
          return "Search experiences, activities..."
        default:
          return placeholder || "Search..."
      }
    }

    return (
      <Input
        ref={ref}
        variant="search"
        leftIcon={<Search className="h-4 w-4" />}
        placeholder={getPlaceholder()}
        {...props}
      />
    )
  },
)
SearchInput.displayName = "SearchInput"

export interface AirportInputProps extends Omit<InputProps, "variant" | "leftIcon"> {
  airportType?: "origin" | "destination"
}

const AirportInput = React.forwardRef<HTMLInputElement, AirportInputProps>(
  ({ airportType = "origin", placeholder, ...props }, ref) => {
    const getPlaceholder = () => {
      return airportType === "origin" ? placeholder || "From where?" : placeholder || "To where?"
    }

    return (
      <Input
        ref={ref}
        variant="location"
        leftIcon={
          airportType === "origin" ? (
            <Plane className="h-4 w-4 rotate-45" />
          ) : (
            <MapPin className="h-4 w-4" />
          )
        }
        placeholder={getPlaceholder()}
        {...props}
      />
    )
  },
)
AirportInput.displayName = "AirportInput"

export interface DateInputProps extends Omit<InputProps, "variant" | "leftIcon" | "type"> {
  dateType?: "departure" | "return" | "general"
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ dateType = "general", placeholder, ...props }, ref) => {
    const getPlaceholder = () => {
      switch (dateType) {
        case "departure":
          return placeholder || "Departure date"
        case "return":
          return placeholder || "Return date"
        default:
          return placeholder || "Select date"
      }
    }

    return (
      <Input
        ref={ref}
        type="date"
        variant="date"
        leftIcon={<Calendar className="h-4 w-4" />}
        placeholder={getPlaceholder()}
        {...props}
      />
    )
  },
)
DateInput.displayName = "DateInput"

// Form group component for related inputs
export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  description?: string
  error?: string
  required?: boolean
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ label, description, error, required, children, className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
      {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}
    </div>
  ),
)
FormGroup.displayName = "FormGroup"

// Named exports for compatibility
export const EnterpriseInput = Input
export const EnterpriseSearchInput = SearchInput
export const EnterpriseAirportInput = AirportInput
export const EnterpriseDateInput = DateInput
export const EnterpriseFormGroup = FormGroup

// Default exports (without duplicates)
export { inputVariants }
