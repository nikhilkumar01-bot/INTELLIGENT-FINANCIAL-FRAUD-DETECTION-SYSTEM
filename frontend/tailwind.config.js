/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0B0F19',
          card: '#111827',
          cardHover: '#161F36',
          panel: '#151C2C',
          border: '#1F293D',
          muted: '#94A3B8',
          accent: '#6366F1',
          cyan: '#06B6D4',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          critical: '#DC2626'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
