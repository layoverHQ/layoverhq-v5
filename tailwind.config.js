/** @type {import('tailwindcss').Config} */
const { designTokens } = require('./lib/design-system/tokens')

module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Google Flights & Priceline inspired colors
        primary: designTokens.colors.primary,
        accent: designTokens.colors.accent,
        success: designTokens.colors.success,
        warning: designTokens.colors.warning,
        error: designTokens.colors.error,
        gray: designTokens.colors.gray,
        background: designTokens.colors.background,
      },
      fontFamily: {
        sans: designTokens.typography.fonts.sans.split(',').map(f => f.trim()),
        display: designTokens.typography.fonts.display.split(',').map(f => f.trim()),
        mono: designTokens.typography.fonts.mono.split(',').map(f => f.trim()),
      },
      fontSize: Object.entries(designTokens.typography.sizes).reduce((acc, [key, value]) => {
        acc[key] = [value.size, { lineHeight: value.lineHeight }]
        return acc
      }, {}),
      fontWeight: designTokens.typography.weights,
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      boxShadow: {
        ...designTokens.shadows,
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "glass-sm": "0 4px 16px 0 rgba(31, 38, 135, 0.25)",
        "travel": "0 10px 40px rgba(0, 0, 0, 0.1)",
        "travel-lg": "0 20px 60px rgba(0, 0, 0, 0.15)",
      },
      screens: designTokens.breakpoints,
      zIndex: designTokens.zIndex,
      transitionDuration: {
        fast: designTokens.transitions.fast,
        default: designTokens.transitions.default,
        slow: designTokens.transitions.slow,
      },
      transitionTimingFunction: designTokens.transitions.easing,
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-down": "slide-down 0.5s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "gradient-x": "gradient-x 3s ease infinite",
        "gradient-y": "gradient-y 3s ease infinite",
        "gradient-xy": "gradient-xy 3s ease infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "scale-in": {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        "gradient-y": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "center top",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "center bottom",
          },
        },
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left top",
          },
          "25%": {
            "background-size": "400% 400%",
            "background-position": "right top",
          },
          "50%": {
            "background-size": "400% 400%",
            "background-position": "right bottom",
          },
          "75%": {
            "background-size": "400% 400%",
            "background-position": "left bottom",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-pattern": "url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "glass-sm": "0 4px 16px 0 rgba(31, 38, 135, 0.25)",
        "travel": "0 10px 40px rgba(0, 0, 0, 0.1)",
        "travel-lg": "0 20px 60px rgba(0, 0, 0, 0.15)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
