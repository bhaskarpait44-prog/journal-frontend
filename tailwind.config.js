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
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-md': '0 4px 12px 0 rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.08)',
        'card-lg': '0 8px 30px 0 rgba(0,0,0,0.16), 0 4px 8px -2px rgba(0,0,0,0.10)',
        'glow-blue':  '0 0 24px rgba(59,130,246,0.25)',
        'glow-green': '0 0 24px rgba(34,197,94,0.25)',
        'glow-red':   '0 0 24px rgba(239,68,68,0.20)',
        'inner-sm':  'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-up':     'fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':     'fadeIn 0.2s ease-out forwards',
        'slide-up':    'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in':    'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':     'shimmer 1.8s linear infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity:'0', transform:'translateY(12px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn:   { from: { opacity:'0' }, to: { opacity:'1' } },
        slideUp:  { from: { opacity:'0', transform:'translateY(20px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        scaleIn:  { from: { opacity:'0', transform:'scale(0.92)' }, to: { opacity:'1', transform:'scale(1)' } },
        shimmer:  { from: { backgroundPosition:'-200% 0' }, to: { backgroundPosition:'200% 0' } },
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
