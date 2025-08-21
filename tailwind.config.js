/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Sophisticated paper-inspired monochrome (Apple aesthetic)
        paper: {
          50: "#fcfcfc",   // Pure, clean white
          100: "#f8f9fa",  // Softest gray
          200: "#f1f3f4",  // Light background
          300: "#e8eaed",  // Subtle border
          400: "#dadce0",  // Muted dividers
          500: "#9aa0a6",  // Neutral text
          600: "#5f6368",  // Secondary text
          700: "#3c4043",  // Primary text
          800: "#202124",  // Dark text
          900: "#1a1a1a",  // Deepest black
          950: "#000000",  // Pure black
        },
        // Elegant primary accent (sophisticated blue)
        primary: {
          50: "#f0f4ff",   // Lightest blue tint
          100: "#e0e7ff",  // Very light blue
          200: "#c7d2fe",  // Light blue
          300: "#a5b4fc",  // Soft blue
          400: "#818cf8",  // Medium blue
          500: "#4c6ef5",  // Sophisticated blue (main)
          600: "#4263eb",  // Deeper blue
          700: "#3b50df",  // Rich blue
          800: "#2e3db3",  // Dark blue
          900: "#1e2875",  // Very dark blue
          950: "#151b4d",  // Deepest blue
        },
        // Warm accent (elegant coral/peach)
        accent: {
          50: "#fef7f0",   // Lightest warm tint
          100: "#feeee0",  // Very light warm
          200: "#fdd9c0",  // Light warm
          300: "#fcb896",  // Soft warm
          400: "#fa8c69",  // Medium warm
          500: "#f97316",  // Vibrant warm (main)
          600: "#ea5a0c",  // Deeper warm
          700: "#c2410c",  // Rich warm
          800: "#9a3412",  // Dark warm
          900: "#7c2d12",  // Very dark warm
          950: "#431407",  // Deepest warm
        },
        // Success/positive accent
        success: {
          50: "#f0fdf4",   // Lightest green
          100: "#dcfce7",  // Very light green
          200: "#bbf7d0",  // Light green
          300: "#86efac",  // Soft green
          400: "#4ade80",  // Medium green
          500: "#22c55e",  // Success green (main)
          600: "#16a34a",  // Deeper green
          700: "#15803d",  // Rich green
          800: "#166534",  // Dark green
          900: "#14532d",  // Very dark green
          950: "#052e16",  // Deepest green
        },
        // Success/action colors
        success: {
          500: "#10b981",
          600: "#059669",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
        mono: ["Space Grotesk", "Menlo", "Monaco", "monospace"],
      },
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
