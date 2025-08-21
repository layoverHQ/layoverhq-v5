/**
 * LayoverHQ Enterprise Design Tokens
 *
 * Based on research of top OTA platforms (Booking.com, Expedia, Skyscanner)
 * and modern Morphic design principles. This system prioritizes:
 *
 * 1. Enterprise trust and credibility
 * 2. Travel industry best practices
 * 3. Accessibility compliance (WCAG 2.1 AA)
 * 4. Scalability and consistency
 * 5. Performance optimization
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const colors = {
  // Primary Brand Colors (Enterprise Travel Blue)
  primary: {
    50: "#eff6ff", // Lightest blue for subtle backgrounds
    100: "#dbeafe", // Very light blue for hover states
    200: "#bfdbfe", // Light blue for secondary elements
    300: "#93c5fd", // Medium-light blue
    400: "#60a5fa", // Medium blue
    500: "#3b82f6", // Primary brand blue (trust, reliability)
    600: "#2563eb", // Darker blue for hover states
    700: "#1d4ed8", // Strong blue for emphasis
    800: "#1e40af", // Very dark blue
    900: "#1e3a8a", // Darkest blue for text
  },

  // Secondary Colors (Warm Travel Orange)
  secondary: {
    50: "#fff7ed", // Lightest orange
    100: "#ffedd5", // Very light orange
    200: "#fed7aa", // Light orange
    300: "#fdba74", // Medium-light orange
    400: "#fb923c", // Medium orange
    500: "#f97316", // Primary orange (adventure, exploration)
    600: "#ea580c", // Darker orange
    700: "#c2410c", // Strong orange
    800: "#9a3412", // Very dark orange
    900: "#7c2d12", // Darkest orange
  },

  // Success Colors (Green)
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e", // Primary success green
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
  },

  // Warning Colors (Amber)
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b", // Primary warning amber
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },

  // Error Colors (Red)
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444", // Primary error red
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },

  // Neutral Colors (Gray Scale)
  neutral: {
    0: "#ffffff", // Pure white
    50: "#f9fafb", // Lightest gray for backgrounds
    100: "#f3f4f6", // Very light gray
    200: "#e5e7eb", // Light gray for borders
    300: "#d1d5db", // Medium-light gray
    400: "#9ca3af", // Medium gray for placeholders
    500: "#6b7280", // Medium-dark gray for secondary text
    600: "#4b5563", // Dark gray for primary text
    700: "#374151", // Very dark gray
    800: "#1f2937", // Almost black for headings
    900: "#111827", // Darkest gray
    950: "#030712", // Near black
  },

  // Semantic Colors for Travel Context
  travel: {
    airline: "#1e40af", // Airlines (trust blue)
    hotel: "#059669", // Hotels (hospitality green)
    experience: "#7c3aed", // Experiences (adventure purple)
    transport: "#dc2626", // Transport (urgent red)
    visa: "#0891b2", // Visa info (information cyan)
    layover: "#f97316", // Layover highlights (exploration orange)
  },

  // Interactive States
  interactive: {
    hover: "rgba(59, 130, 246, 0.04)", // Subtle blue hover
    active: "rgba(59, 130, 246, 0.08)", // Slightly stronger blue active
    focus: "rgba(59, 130, 246, 0.12)", // Focus ring color
    disabled: "rgba(156, 163, 175, 0.5)", // Disabled state
  },
} as const

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const typography = {
  // Font Families
  fonts: {
    heading: ["Inter", "system-ui", "-apple-system", "sans-serif"],
    body: ["Inter", "system-ui", "-apple-system", "sans-serif"],
    mono: ["JetBrains Mono", "Menlo", "Monaco", "Consolas", "monospace"],
  },

  // Font Sizes (rem-based for accessibility)
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px (base)
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
    "6xl": "3.75rem", // 60px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const

// ============================================================================
// SPACING SYSTEM
// ============================================================================

export const spacing = {
  // Base spacing unit: 4px (0.25rem)
  px: "1px",
  0: "0",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem", // 12px
  3.5: "0.875rem", // 14px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  7: "1.75rem", // 28px
  8: "2rem", // 32px
  9: "2.25rem", // 36px
  10: "2.5rem", // 40px
  11: "2.75rem", // 44px
  12: "3rem", // 48px
  14: "3.5rem", // 56px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  28: "7rem", // 112px
  32: "8rem", // 128px
  36: "9rem", // 144px
  40: "10rem", // 160px
  44: "11rem", // 176px
  48: "12rem", // 192px
  52: "13rem", // 208px
  56: "14rem", // 224px
  60: "15rem", // 240px
  64: "16rem", // 256px
  72: "18rem", // 288px
  80: "20rem", // 320px
  96: "24rem", // 384px
} as const

// ============================================================================
// BORDER RADIUS SYSTEM
// ============================================================================

export const borderRadius = {
  none: "0",
  sm: "0.125rem", // 2px
  base: "0.25rem", // 4px (default)
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px", // Fully rounded
} as const

// ============================================================================
// SHADOWS SYSTEM
// ============================================================================

export const shadows = {
  // Elevation system for depth
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", // Subtle
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)", // Default
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", // Medium
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", // Large
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", // Extra large
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)", // Prominent
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)", // Inner shadow

  // Focus states
  focus: "0 0 0 3px rgba(59, 130, 246, 0.1)", // Focus ring
  "focus-error": "0 0 0 3px rgba(239, 68, 68, 0.1)", // Error focus
  "focus-success": "0 0 0 3px rgba(34, 197, 94, 0.1)", // Success focus
} as const

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: "640px", // Mobile landscape
  md: "768px", // Tablet portrait
  lg: "1024px", // Tablet landscape / Small desktop
  xl: "1280px", // Desktop
  "2xl": "1536px", // Large desktop
} as const

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  auto: "auto",
  0: 0,
  10: 10, // Dropdowns
  20: 20, // Sticky headers
  30: 30, // Modals backdrop
  40: 40, // Modals content
  50: 50, // Tooltips
  60: 60, // Notifications
  70: 70, // Maximum application level
} as const

// ============================================================================
// ANIMATION SYSTEM
// ============================================================================

export const animation = {
  // Durations (in milliseconds for JS, seconds for CSS)
  duration: {
    instant: 0,
    fast: 150, // 0.15s
    normal: 200, // 0.2s
    slow: 300, // 0.3s
    slower: 500, // 0.5s
    slowest: 1000, // 1s
  },

  // Easing functions
  easing: {
    linear: "linear",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeInBack: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    easeOutBack: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const

// ============================================================================
// COMPONENT SPECIFIC TOKENS
// ============================================================================

export const components = {
  // Button system
  button: {
    height: {
      sm: "2rem", // 32px
      md: "2.5rem", // 40px
      lg: "3rem", // 48px
    },
    padding: {
      sm: { x: "0.75rem", y: "0.5rem" },
      md: { x: "1rem", y: "0.625rem" },
      lg: { x: "1.5rem", y: "0.75rem" },
    },
  },

  // Card system
  card: {
    padding: {
      sm: "1rem", // 16px
      md: "1.5rem", // 24px
      lg: "2rem", // 32px
    },
    borderRadius: borderRadius.lg,
    shadow: shadows.base,
  },

  // Input system
  input: {
    height: {
      sm: "2rem", // 32px
      md: "2.5rem", // 40px
      lg: "3rem", // 48px
    },
    borderRadius: borderRadius.base,
    borderWidth: "1px",
  },
} as const

// ============================================================================
// ACCESSIBILITY TOKENS
// ============================================================================

export const a11y = {
  // Focus indicators
  focusRing: {
    width: "2px",
    style: "solid",
    color: colors.primary[500],
    offset: "2px",
  },

  // Minimum touch/click targets (44px per WCAG)
  minTouchTarget: "44px",

  // Text contrast ratios
  contrast: {
    normal: 4.5, // AA standard
    large: 3, // AA standard for large text
    enhanced: 7, // AAA standard
  },
} as const

// ============================================================================
// EXPORT DEFAULT THEME
// ============================================================================

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  animation,
  components,
  a11y,
} as const

export type DesignTokens = typeof designTokens
export type Colors = typeof colors
export type Typography = typeof typography
export type Spacing = typeof spacing
