/**
 * Enterprise Card Component
 *
 * Based on analysis of top OTA platforms (Booking.com, Expedia, Skyscanner)
 * and modern Morphic design principles. Features:
 * - Multiple variants for different content types
 * - Hover states and interactions
 * - Accessibility support
 * - Travel-specific styling options
 * - Performance optimized with GPU acceleration
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  [
    // Base styles
    "relative overflow-hidden",
    "bg-white dark:bg-neutral-800",
    "border border-neutral-200 dark:border-neutral-700",
    "transition-all duration-300 ease-out",

    // Performance optimization
    "will-change-transform",
  ],
  {
    variants: {
      variant: {
        // Default card for general content
        default: [
          "rounded-xl shadow-sm",
          "hover:shadow-md hover:border-neutral-300",
          "dark:hover:border-neutral-600",
        ],

        // Flight result cards
        flight: [
          "rounded-2xl shadow-lg border-2 border-primary-100",
          "hover:shadow-xl hover:border-primary-200 hover:-translate-y-1",
          "dark:border-primary-900 dark:hover:border-primary-800",
        ],

        // Hotel booking cards
        hotel: [
          "rounded-2xl shadow-md border border-success-200",
          "hover:shadow-lg hover:border-success-300 hover:-translate-y-0.5",
          "dark:border-success-800 dark:hover:border-success-700",
        ],

        // Experience/activity cards
        experience: [
          "rounded-2xl shadow-md overflow-hidden",
          "hover:shadow-xl hover:-translate-y-1",
          "group cursor-pointer",
        ],

        // Layover highlight cards
        layover: [
          "rounded-2xl border-2 border-secondary-200",
          "bg-gradient-to-br from-secondary-50 to-secondary-100",
          "hover:from-secondary-100 hover:to-secondary-200",
          "hover:shadow-lg hover:border-secondary-300",
          "dark:from-secondary-950/20 dark:to-secondary-900/20",
          "dark:border-secondary-800 dark:hover:border-secondary-700",
        ],

        // Interactive cards (clickable)
        interactive: [
          "rounded-xl shadow-sm cursor-pointer",
          "hover:shadow-lg hover:border-primary-200 hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "dark:hover:border-primary-800",
        ],

        // Floating cards with glassmorphism
        floating: [
          "rounded-2xl backdrop-blur-lg",
          "bg-white/80 dark:bg-neutral-900/80",
          "border border-white/20 dark:border-neutral-700/50",
          "shadow-2xl",
          "hover:bg-white/90 dark:hover:bg-neutral-900/90",
          "hover:shadow-3xl hover:-translate-y-1",
        ],

        // Minimal cards
        minimal: [
          "rounded-lg bg-transparent border-none",
          "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
        ],
      },

      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6", // Default
        lg: "p-8",
        xl: "p-12",
      },

      elevation: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
        xl: "shadow-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      elevation: "sm",
    },
  },
)

const cardContentVariants = cva("relative z-10")

const cardHeaderVariants = cva(["flex flex-col space-y-1.5", "mb-4 last:mb-0"])

const cardTitleVariants = cva([
  "text-lg font-semibold leading-none tracking-tight",
  "text-neutral-900 dark:text-neutral-50",
])

const cardDescriptionVariants = cva([
  "text-sm text-neutral-600 dark:text-neutral-400",
  "leading-relaxed",
])

const cardFooterVariants = cva([
  "flex items-center justify-between",
  "mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700",
  "first:mt-0 first:pt-0 first:border-t-0",
])

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, elevation, asChild, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, elevation, className }))}
        {...props}
      />
    )
  },
)
Card.displayName = "Card"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
>(({ className, noPadding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardContentVariants(), !noPadding && "p-6 pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(cardHeaderVariants(), className)} {...props} />
  ),
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn(cardTitleVariants(), className)} {...props} />
  ),
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn(cardDescriptionVariants(), className)} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(cardFooterVariants(), className)} {...props} />
  ),
)
CardFooter.displayName = "CardFooter"

// Specialized card components for travel contexts

export interface FlightCardProps extends CardProps {
  price?: string
  airline?: string
  duration?: string
  layoverScore?: number
}

const FlightCard = React.forwardRef<HTMLDivElement, FlightCardProps>(
  ({ price, airline, duration, layoverScore, children, ...props }, ref) => (
    <Card ref={ref} variant="flight" {...props}>
      {children}
      {(price || airline || duration || layoverScore) && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
          {price && (
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {price}
            </div>
          )}
          {layoverScore && (
            <div className="bg-secondary-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
              Score: {layoverScore}/10
            </div>
          )}
        </div>
      )}
    </Card>
  ),
)
FlightCard.displayName = "FlightCard"

export interface ExperienceCardProps extends CardProps {
  rating?: number
  duration?: string
  price?: string
  category?: string
  image?: string
}

const ExperienceCard = React.forwardRef<HTMLDivElement, ExperienceCardProps>(
  ({ rating, duration, price, category, image, children, ...props }, ref) => (
    <Card ref={ref} variant="experience" padding="none" {...props}>
      {image && (
        <div className="aspect-video overflow-hidden">
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        {children}
        {(rating || duration || price || category) && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              {duration && <span>{duration}</span>}
              {category && (
                <>
                  <span>•</span>
                  <span className="capitalize">{category}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {rating && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <span className="text-sm">★</span>
                  <span className="text-sm font-medium">{rating}</span>
                </div>
              )}
              {price && (
                <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                  {price}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  ),
)
ExperienceCard.displayName = "ExperienceCard"

// Named exports for compatibility
export const EnterpriseCard = Card
export const EnterpriseCardContent = CardContent
export const EnterpriseCardDescription = CardDescription
export const EnterpriseCardFooter = CardFooter
export const EnterpriseCardHeader = CardHeader
export const EnterpriseCardTitle = CardTitle
export const EnterpriseFlightCard = FlightCard
export const EnterpriseExperienceCard = ExperienceCard

// Default exports (without duplicates)
export { cardVariants }
