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
        accent: { DEFAULT: '#3b82f6', dark: '#2563eb', light: '#60a5fa' },
        profit: '#22c55e',
        loss: '#ef4444',
        warning: '#eab308',
        purple: '#a855f7',
        // Semantic tokens from CSS variables
        base: 'var(--bg-base)',
        card: 'var(--bg-card)',
        'card-alt': 'var(--bg-card-alt)',
        sidebar: 'var(--bg-sidebar)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      screens: {
        'sm': '640px',
        'md': '900px',
        'lg': '1200px',
      },
    },
  },
  plugins: [],
}
