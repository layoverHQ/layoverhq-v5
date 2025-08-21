/**
 * LayoverHQ Design System Tokens
 * Inspired by Google Flights & Priceline
 */

export const designTokens = {
  colors: {
    // Primary - Google Blue inspired
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#1a73e8', // Main primary (Google Flights blue)
      600: '#1976d2',
      700: '#1565c0',
      800: '#0d47a1',
      900: '#01579b',
    },
    
    // Accent - Priceline inspired orange
    accent: {
      50: '#fff3e0',
      100: '#ffe0b2',
      200: '#ffcc80',
      300: '#ffb74d',
      400: '#ffa726',
      500: '#ff6b35', // Priceline orange
      600: '#fb8c00',
      700: '#f57c00',
      800: '#ef6c00',
      900: '#e65100',
    },
    
    // Semantic colors
    success: {
      50: '#e8f5e9',
      500: '#34a853', // Google green
      600: '#2e7d32',
    },
    
    warning: {
      50: '#fff8e1',
      500: '#fbbc04', // Google yellow
      600: '#f9a825',
    },
    
    error: {
      50: '#ffebee',
      500: '#ea4335', // Google red
      600: '#d32f2f',
    },
    
    // Neutral palette
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    
    // Background colors
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#f1f3f4',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
  },
  
  typography: {
    // Font families
    fonts: {
      sans: '"Google Sans", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: '"Google Sans Display", "Roboto", sans-serif',
      mono: '"Roboto Mono", "SF Mono", monospace',
    },
    
    // Font sizes with line heights
    sizes: {
      xs: { size: '0.75rem', lineHeight: '1rem' },      // 12px
      sm: { size: '0.875rem', lineHeight: '1.25rem' },   // 14px
      base: { size: '1rem', lineHeight: '1.5rem' },      // 16px
      lg: { size: '1.125rem', lineHeight: '1.75rem' },   // 18px
      xl: { size: '1.25rem', lineHeight: '1.75rem' },    // 20px
      '2xl': { size: '1.5rem', lineHeight: '2rem' },     // 24px
      '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px
      '4xl': { size: '2.25rem', lineHeight: '2.5rem' },  // 36px
      '5xl': { size: '3rem', lineHeight: '1' },          // 48px
    },
    
    // Font weights
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  spacing: {
    // Spacing scale (px)
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    default: '0.5rem', // 8px - Google standard
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',
  },
  
  shadows: {
    // Google Material Design inspired shadows
    none: 'none',
    sm: '0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15)',
    default: '0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15)',
    md: '0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15)',
    lg: '0 2px 3px 0 rgba(60, 64, 67, 0.3), 0 6px 10px 4px rgba(60, 64, 67, 0.15)',
    xl: '0 4px 5px 0 rgba(60, 64, 67, 0.3), 0 8px 10px 1px rgba(60, 64, 67, 0.15)',
    '2xl': '0 8px 10px 1px rgba(60, 64, 67, 0.3), 0 16px 24px 2px rgba(60, 64, 67, 0.15)',
  },
  
  transitions: {
    // Transition durations
    fast: '150ms',
    default: '250ms',
    slow: '350ms',
    
    // Easing functions
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  breakpoints: {
    // Mobile-first breakpoints
    sm: '640px',   // Small tablets
    md: '768px',   // Tablets
    lg: '1024px',  // Small laptops
    xl: '1280px',  // Desktops
    '2xl': '1536px', // Large screens
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
}

// Semantic aliases for easier use
export const theme = {
  // Text styles (Google Flights inspired)
  text: {
    hero: `font-light text-5xl tracking-tight`,
    heading1: `font-medium text-3xl`,
    heading2: `font-medium text-2xl`,
    heading3: `font-medium text-xl`,
    body: `font-normal text-base text-gray-700`,
    bodySmall: `font-normal text-sm text-gray-600`,
    caption: `font-normal text-xs text-gray-500`,
    button: `font-medium text-sm`,
    link: `font-normal text-base text-primary-600 hover:text-primary-700`,
  },
  
  // Component styles
  card: {
    base: `bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-250`,
    padding: `p-6`,
  },
  
  button: {
    primary: `bg-primary-500 text-white hover:bg-primary-600 px-6 py-3 rounded-lg font-medium transition-colors`,
    secondary: `bg-white text-primary-600 border border-primary-600 hover:bg-primary-50 px-6 py-3 rounded-lg font-medium transition-colors`,
    ghost: `text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors`,
  },
  
  input: {
    base: `w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`,
    error: `border-error-500 focus:ring-error-500`,
  },
}

// Tailwind config generator
export const generateTailwindConfig = () => ({
  theme: {
    extend: {
      colors: designTokens.colors,
      fontFamily: {
        sans: designTokens.typography.fonts.sans.split(','),
        display: designTokens.typography.fonts.display.split(','),
        mono: designTokens.typography.fonts.mono.split(','),
      },
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      transitionDuration: {
        fast: designTokens.transitions.fast,
        default: designTokens.transitions.default,
        slow: designTokens.transitions.slow,
      },
      screens: designTokens.breakpoints,
      zIndex: designTokens.zIndex,
    },
  },
})