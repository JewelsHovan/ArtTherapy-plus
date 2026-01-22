/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors (Violet)
        primary: {
          DEFAULT: '#7C3AED',
          hover: '#6D28D9',
          light: '#EDE9FE',
          dark: '#5B21B6',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Secondary Brand Colors (Pink)
        secondary: {
          DEFAULT: '#F472B6',
          hover: '#EC4899',
          light: '#FCE7F3',
          dark: '#DB2777',
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
        },
        // Accent Colors (Yellow)
        accent: {
          DEFAULT: '#FCD34D',
          hover: '#FBBF24',
          light: '#FEF9C3',
          dark: '#F59E0B',
          300: '#FDE68A',
          400: '#FCD34D',
          500: '#FBBF24',
        },
        // Cream Background Colors
        cream: {
          DEFAULT: '#FEFDFB',
          50: '#FEFDFB',
          100: '#FDF8F3',
          200: '#FAF5EE',
          300: '#F5EDE4',
        },
        // Warm Neutral Colors
        warm: {
          gray: '#6B5B5B',
          text: '#3D3535',
        },
        // Text Colors
        'text-primary': '#1F2937',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',
        'text-light': '#FFFFFF',
        // Background Colors
        'bg-lavender': '#fbf5fe',
        'bg-card': '#FFFFFF',
        // Semantic Colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#7C3AED',
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
        'display': ['Fraunces', 'Georgia', 'serif'],
        'body': ['Outfit', 'Inter', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],  // backward compat
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'soft-md': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 20px rgba(124, 58, 237, 0.15)',
      },
    },
  },
  plugins: [],
}
