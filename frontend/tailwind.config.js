/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: '#000000',
        'blue-dark': '#262626',
        charcoal: '#0A0A0A',
        'gray-dark': '#374151',
        'gray-mid': '#6B7280',
        'gray-light': '#E5E7EB',
        cream: '#F9FAFB',
        white: '#FFFFFF',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground' : 'hsl(var(--sidebar-accent))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        }
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
      },
      fontSize: {
        'hero-title': '92px',
        'hero-subtitle': '16px',
        'stats-number': '36px',
        'stats-label': '20px',
        'nav-text': '16px',
      },
      spacing: {
        'hero-top': '200px',
      }
    },
  },
  plugins: [],
}

