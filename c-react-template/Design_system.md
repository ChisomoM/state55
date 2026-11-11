# Modern Premium Design System (Vite)

## Design Philosophy

- **Quiet Premium**: Refined without ostentation
- **Generous Spacing**: Never cramped – use padding liberally
- **Minimal Blue**: Accent only on CTAs/hover (10% rule)
- **Clean Typography**: Editorial quality, readable hierarchy
- **Smooth Motion**: Noticeable but not distracting

---

## Color System

```javascript
// Define in CSS variables or config
--blue: #3B82F6;         // CTAs, active states
--blue-dark: #1E40AF;    // Hover states
--charcoal: #1F2937;     // Primary text
--gray-dark: #374151;    // Body text
--gray-mid: #6B7280;     // Secondary text
--gray-light: #E5E7EB;   // Borders
--cream: #F9FAFB;        // Alt background
--white: #FFFFFF;        // Primary bg
```

**Rules:**
- Blue only on buttons, hover states, accents
- Maintain 4.5:1 contrast ratio (WCAG AA)
- Alternate sections: white → cream → white
- Text: charcoal (headings) → gray-dark (body) → gray-mid (captions)

---

## Typography

### Font Setup
```javascript
// index.html head
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap" rel="stylesheet">

// main.css
:root {
  --font-sora: 'Sora', sans-serif;
}

body {
  font-family: var(--font-sora);
  font-weight: 400;
  letter-spacing: -0.01em;
}
```

### Type Scale
```css
/* Headings */
h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 700; letter-spacing: -0.02em; }
h2 { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 700; }
h3 { font-size: clamp(1.25rem, 3vw, 1.75rem); font-weight: 600; }

/* Body */
p { font-size: clamp(1rem, 2vw, 1.125rem); font-weight: 400; line-height: 1.6; }
small { font-size: 0.875rem; font-weight: 300; }

/* Buttons */
button { font-size: 1rem; font-weight: 600; letter-spacing: 0; }
```

---

## Layout & Spacing (Mobile-First)

### Page Structure
```jsx
<div className="min-h-screen bg-white">
  <div className="pt-20 pb-16 md:pt-24 md:pb-20"> {/* Adjust for navbar */}
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-12">
      {/* Content */}
    </div>
  </div>
</div>
```

### Section Spacing
```css
/* Vertical spacing (mobile-first) */
.section-lg { padding: 3rem 0 md:4rem 0; }
.section-md { padding: 2rem 0 md:2.5rem 0; }
.section-sm { padding: 1.5rem 0 md:2rem 0; }

/* Horizontal padding */
main { padding: 0 1rem; } /* 16px mobile */
@media (min-width: 768px) { main { padding: 0 1.5rem; } } /* 24px tablet */
@media (min-width: 1024px) { main { padding: 0 3rem; } } /* 48px desktop */
```

### Grid Patterns
```jsx
// Product grid (responsive)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">

// Two-column layout
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

// Feature grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```

---

## Components

### Hero Section
```jsx
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="py-12 md:py-20"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal mb-4">
        Your Headline
      </h1>
      <p className="text-lg text-gray-mid max-w-2xl">
        Supporting description text
      </p>
    </motion.section>
  );
}
```

### Buttons
```jsx
// Primary (Blue)
<button className="bg-blue hover:bg-blue-dark text-white font-semibold px-6 py-3 transition-colors">
  Action
</button>

// Secondary (Charcoal)
<button className="bg-charcoal hover:bg-blue text-white font-semibold px-6 py-3 transition-colors">
  Action
</button>

// Outline
<button className="border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white px-6 py-3 transition-colors">
  Action
</button>
```

### Card Grid
```jsx
import { motion } from 'framer-motion';

export function CardGrid({ items }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          viewport={{ once: true, margin: '-50px' }}
          className="group"
        >
          <div className="relative aspect-square overflow-hidden bg-cream rounded-lg mb-4">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <h3 className="font-semibold text-lg text-charcoal group-hover:text-blue transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-gray-mid mt-2">{item.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
```

---

## Animations

### Setup
```javascript
// main.jsx
import { motion } from 'framer-motion';
```

### Fade-In on Scroll
```jsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  viewport={{ once: true, margin: '-100px' }}
>
  Content
</motion.div>
```

### Stagger Items
```jsx
{items.map((item, idx) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: idx * 0.08 }}
    viewport={{ once: true }}
  >
    {item.content}
  </motion.div>
))}
```

### Hover Effect
```jsx
<motion.div
  whileHover={{ y: -8 }}
  transition={{ duration: 0.3 }}
>
  Hoverable content
</motion.div>
```

**Timing Standards:**
- Page load: 0.6s
- Hover: 0.3s
- Stagger: 0.08-0.1s per item
- Image scale: 0.5s

---

## Mobile-First Approach

### Start Small, Scale Up
```css
/* Base: Mobile (320px+) */
.section { padding: 1rem; font-size: 1rem; }
.grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }

/* Tablet (768px+) */
@media (min-width: 768px) {
  .section { padding: 1.5rem; }
  .grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .section { padding: 2rem; }
  .grid { grid-template-columns: repeat(3, 1fr); gap: 2rem; }
}
```

### Responsive Images
```jsx
<picture>
  <source media="(max-width: 640px)" srcSet="image-sm.jpg" />
  <source media="(max-width: 1024px)" srcSet="image-md.jpg" />
  <img src="image-lg.jpg" alt="Description" className="w-full h-auto" />
</picture>
```

### Touch-Friendly Targets
```css
/* Buttons/interactive elements */
button, a { min-height: 44px; min-width: 44px; } /* iOS accessibility */
```

---

## Vite Setup Essentials

### package.json Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.x",
    "lucide-react": "^latest"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

### Tailwind Config (vite setup)
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: 'var(--blue)',
        'blue-dark': 'var(--blue-dark)',
        charcoal: 'var(--charcoal)',
        'gray-mid': 'var(--gray-mid)',
        cream: 'var(--cream)',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
      },
    },
  },
};
```

---

## Quick Checklist

- [ ] Mobile-first CSS (start at 320px)
- [ ] Use Sora font everywhere
- [ ] Blue only on CTAs/hover (10% max)
- [ ] Generous padding/spacing
- [ ] Smooth transitions (0.3s - 0.6s)
- [ ] Test on mobile first, then scale up
- [ ] Use Framer Motion for scroll animations
- [ ] 4.5:1 contrast ratio minimum
- [ ] Semantic HTML (`<header>`, `<main>`, `<section>`)
- [ ] Touch targets 44px minimum

---

## Helpful Patterns

**Section with background toggle:**
```jsx
<section className="py-12 md:py-20 bg-white">...</section>
<section className="py-12 md:py-20 bg-cream">...</section>
```

**Empty state:**
```jsx
<div className="text-center py-12">
  <h3 className="text-xl font-semibold text-charcoal">Nothing here yet</h3>
  <p className="text-gray-mid mt-2">Try again later</p>
</div>
```

**Loading skeleton:**
```jsx
<div className="animate-pulse space-y-4">
  <div className="h-12 bg-gray-light rounded"></div>
  <div className="grid grid-cols-3 gap-4">
    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-light rounded" />)}
  </div>
</div>
```

---

**Remember:** Consistency is premium. Build fast, iterate iteratively, keep it clean.