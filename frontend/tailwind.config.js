/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: '#3B82F6',
        'blue-dark': '#1E40AF',
        charcoal: '#1F2937',
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
        inter: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'orange-gradient': 'linear-gradient(to right, #D70F0E 0%, #E5600B 70%)',
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

