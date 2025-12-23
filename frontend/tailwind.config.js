/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors (Blue)
        primary: {
          DEFAULT: '#3B82F6',  // Blue-500 - main brand color
          hover: '#2563EB',    // Blue-600 - hover state
          light: '#DBEAFE',    // Blue-100 - light backgrounds
          dark: '#1D4ED8',     // Blue-700 - dark variant
        },
        // Secondary Brand Colors (Amber/Orange)
        secondary: {
          DEFAULT: '#F59E0B',  // Amber-500 - accent color
          hover: '#D97706',    // Amber-600 - hover state
          light: '#FEF3C7',    // Amber-100 - light backgrounds
        },
        // Text Colors
        'text-primary': '#1F2937',   // Gray-800 - main text
        'text-secondary': '#6B7280', // Gray-500 - secondary text
        'text-tertiary': '#9CA3AF',  // Gray-400 - muted text
        'text-light': '#FFFFFF',     // White text
        // Background Colors
        'bg-lavender': '#fbf5fe',    // App background
        'bg-card': '#FFFFFF',        // Card backgrounds
        // Semantic Colors
        success: '#10B981',  // Green-500
        warning: '#F59E0B',  // Amber-500
        error: '#EF4444',    // Red-500
        info: '#3B82F6',     // Blue-500
        // Gray Scale (for borders, backgrounds, etc.)
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'soft-md': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
