# Motherland Design System (Vite + React)

> Read this whole file before writing any UI for Motherland. It is the single source of truth for code. Where this file and a hunch disagree, this file wins.
>
> - Design system (tokens, components, previews): https://claude.ai/artifact/9tr7grV6FfoLihTe4KfSDa
> - Visual brand guide: https://claude.ai/artifact/5GgZQicbyMY1pzzM8c4Asv
> - Scaffold a new app: `pnpm dlx degit https://github.com/ChisomoM/c-react-template app-name`

---

## 0. What Motherland is (context the AI needs)

- **Product:** a Pan-African digital platform with three pillars:
  - **Community:** groups by town, school, trade and diaspora; events; member directory.
  - **Services:** apply for, pay for and track public services, with a reference number at every step.
  - **Voice:** petitions, consultations, town halls, published results.
- **Sub-products:** Motherland Community, Motherland Services, Motherland Voice, Motherland ID (membership card). **State 55** is a separate product with its own sub-mark (not designed yet), endorsed as "A Motherland platform".
- **Audience:** Africans aged 16 and over, on the continent and in the diaspora. Most use mid-range Android phones on expensive, unreliable data. Many read English, French or Portuguese as a second or third language. Also community leaders, public servants handling requests, and partner NGOs, unions and ministries.
- **Positioning:** *the authority of a union x the warmth of a village square.*
- **Essence:** Motherland is the place Africans come home to, online.
- **Feel:** an institution (union, ministry, NGO, council) carried by African colour and textile pattern. It is not a startup, not a safari brochure and not a political rally.

### Non-negotiables

1. **No M-letterform logos.** The logo is the **wordmark lockup**: MOTHERLAND in Archivo ExtraBold capitals on the weave band. Never invent a symbol.
2. **The weave band** (five tiles in fixed order) is the signature graphic. Never recolour, reorder or rotate it, and never put text on it.
3. **Earth, Clay, Ochre** lead the palette. No blue or purple brand colours, no neon.
4. **Soft corners, one scale.** Controls (buttons, inputs, selects, tabs) are 12px (`rounded-xl`), cards, dialogs and tiles are 16px (`rounded-2xl`), badges, switches and avatars are pills. Never mix in 2 to 6px corners.
5. **No em dashes, no exclamation marks in the product, no emoji, no hype words** (see Voice).
6. **Every confirmation shows a reference, a date and the next step.**
7. **Mobile and low-data first.** Assume a 360px-wide Android phone on 3G.

---

## 1. Design Philosophy

- **Institutional Warmth:** structure, type and layout come from the institution; colour and pattern come from the continent (60 / 40).
- **Rooted, not folkloric:** real textile geometry, earth pigments, many languages. No masks, drums, safari animals, acacia sunsets or maps of Africa as decoration.
- **Plain and dignified:** one idea per sentence, sentence case, receipts for every action.
- **Colour in blocks, never as a wash:** solid fields of Earth, Clay and Ochre on Ivory. The only gradient in the product is the primary button fill (section 3).
- **Compact and scannable:** the whole product runs on a 14px root, 36 to 40px controls and 12 to 14px text. Density comes from proportion, not from cramming.
- **Depth through surface, not outline:** a sunken page, raised white cards, soft Earth-tinted shadows that lift on hover, filled inputs. Borders are hairlines (`--line`), never heavy.
- **Assembled, not hand-built:** every product page is composed from the shared page furniture in section 7.12, so pages cannot drift apart.
- **Purposeful motion:** 150 to 600ms on one spring curve, small movements, indicators that slide to show what changed. Always respect `prefers-reduced-motion`.

---

## 2. Colour System

### 2.1 Raw palette (brand references, theme-stable)

```css
--clay-600:   #B5381F; /* Clay: the brand. Fired earth, laterite roads */
--ochre-400:  #E0A030; /* Ochre: the accent. Harvest, gold */
--baobab-700: #1F6B45; /* Baobab: services, success, growth */
--lake-700:   #0D6B64; /* Lake: links, info, focus, diaspora */
--earth-900:  #1E1410; /* Earth: ink and dark grounds */
--sand-100:   #F5EDE0; /* Sand: panels, raised light surfaces */
--ivory-50:   #FBF7F0; /* Ivory: brand colour for text on dark grounds and graphics. NOT the app background */
```

### 2.2 Semantic tokens (use these in components, never the raw palette)

```css
/* src/styles/tokens.css */
:root, [data-theme="light"] {
  /* surfaces */
  --surface:          #F9F8F6; /* page: a clean near-white, not cream */
  --surface-raised:   #FFFFFF; /* cards, inputs, dialogs */
  --surface-sunken:   #F1EFEB; /* inputs, tab tracks, skeletons, hover rows */
  --surface-inverse:  #1E1410; /* footer, hero blocks, ID card */

  /* text */
  --ink:              #1E1410; /* headings + body, 16.9:1 on surface */
  --ink-muted:        #5C4A3E; /* secondary text, 7.8:1 */
  --ink-inverse:      #FBF7F0; /* text on surface-inverse */

  /* lines */
  --line:             #E5E0D8; /* dividers, card borders (decorative) */
  --line-strong:      #8C7663; /* input/checkbox borders, 4.0:1 */

  /* brand */
  --brand:            #B5381F; /* primary buttons, active tab */
  --on-brand:         #FFFFFF; /* text on brand, 5.9:1 */
  --brand-strong:     #8F2B17; /* hover, brand text on brand-soft */
  --brand-soft:       #F6DCD3; /* selected rows, brand badges */

  /* accent (ochre): FILL ONLY, never text on light grounds (2.1:1) */
  --accent:           #E0A030;
  --on-accent:        #1E1410;
  --accent-strong:    #7A5208; /* ochre-family text, warnings */
  --accent-soft:      #F8E7C4;

  /* status: always pair with an icon AND a word */
  --success:          #1F6B45;  --success-soft: #DCEFE2;
  --info:             #0D6B64;  --info-soft:    #D5EEEB;
  --danger:           #9F1D1D;  --danger-soft:  #F9DEDB;
  --warning:          #7A5208;  --warning-soft: #F8E7C4;

  /* focus */
  --focus:            #0D6B64; /* 2px ring, 2px offset */
}

[data-theme="dark"] {
  --surface:          #17100C;
  --surface-raised:   #241914;
  --surface-sunken:   #120C09;
  --surface-inverse:  #F5EDE0;
  --ink:              #F5EDE0;
  --ink-muted:        #C9B8A6;
  --ink-inverse:      #1E1410;
  --line:             #3A2C23;
  --line-strong:      #7A6655;
  --brand:            #E0613F;
  --on-brand:         #1E1410;
  --brand-strong:     #F2937A;
  --brand-soft:       #4A1E14;
  --accent:           #E8B04A;
  --accent-strong:    #F0C46E;
  --accent-soft:      #3D2C10;
  --success:          #5BBF8A;  --success-soft: #12301F;
  --info:             #4FC2B8;  --info-soft:    #0E2A28;
  --danger:           #F2867A;  --danger-soft:  #3E1513;
  --warning:          #F0C46E;  --warning-soft: #3D2C10;
  --focus:            #4FC2B8;
}
```

### 2.3 Rules

- **Proportion on a typical screen:** Ivory + Sand 55%, Earth 25%, Clay 10%, Ochre 4%, Baobab 3%, Lake 3%.
- **One primary (clay) button per view.** Everything else is secondary or ghost.
- **Ochre** is a fill (tier tags, highlights, the accent button) and, on Earth grounds only, a text colour (`text-accent`). Use `--accent-strong` when you need ochre-coloured text.
- **Danger is darker than brand** so the two differ in lightness. Never rely on red alone: icon + words.
- **Sections alternate:** Ivory, then Earth (flat, no glow), then White or Ivory. Never two dark sections in a row.
- **Text hierarchy:** `--ink` for headings and body, `--ink-muted` for captions and helper text. No grey lighter than `--ink-muted` for text.
- **Contrast:** 4.5:1 for text, 3:1 for large text (24px+), input borders, icons and focus rings. Every pair above passes in both themes; ochre on light is the one deliberate fail.

### 2.4 Contrast table (light theme)

| Pair | Ratio | Use |
| --- | --- | --- |
| ink on surface | 16.9:1 | Body text |
| ink-muted on surface | 7.9:1 | Secondary text |
| brand on surface | 5.5:1 | Brand text, campaign links |
| on-brand on brand | 5.9:1 | Primary button label |
| brand-strong on brand-soft | 6.4:1 | Brand badge |
| on-accent on accent | 7.9:1 | Text on ochre |
| accent-strong on accent-soft | 5.7:1 | Warning text |
| success on success-soft | 5.4:1 | Success badge |
| info on surface | 6.0:1 | Links |
| danger on danger-soft | 6.2:1 | Error message |
| line-strong on surface | 4.0:1 | Input borders |
| **accent on surface** | **2.1:1 (fail)** | **Never** |

---

## 3. Gradients (one, on the primary button)

The primary (clay) button is the only gradient fill in the product. It stays inside the clay family so white label text keeps AA contrast (5.9:1 at the light end, higher at the dark end). Everything else is a flat colour.

```css
--gradient-cta:       linear-gradient(120deg, #8F2B17 0%, #B5381F 55%, #C8452A 100%);
--gradient-cta-hover: linear-gradient(120deg, #7A2413 0%, #9F3019 55%, #B5381F 100%);
--shadow-cta:         0 4px 14px rgba(181,56,31,.28), 0 1px 3px rgba(30,20,16,.2);
/* dark theme lightens all three; see tokens.css */

.btn-cta { background: var(--gradient-cta); box-shadow: var(--shadow-cta); transition: background 200ms ease, box-shadow 200ms ease; }
.btn-cta:hover:not(:disabled) { background: var(--gradient-cta-hover); }

/* Dark section: a flat Earth ground. No glow, no gradient. */
.section-dark { background: var(--earth-900); color: var(--ivory-50); }
```

A scrim under text on photos (`linear-gradient(0deg, rgba(30,20,16,.85), transparent 55%)`) and the fade that blends the tile mosaic into Earth are functional overlays, not decoration, and are the only other gradients allowed.

**Rules:** the CTA gradient lives on the primary button only. Never on cards, stat tiles, headings, display words, icons, badges or backgrounds. Ochre words on Earth are plain `text-accent`. No blue, purple, pink or rainbow gradients, ever.

---

## 4. Typography

### 4.1 Fonts

| Role | Family | Weights | Why |
| --- | --- | --- | --- |
| Display, headings, labels, wordmark | **Archivo** | 600, 700, 800 | Heavy poster capitals: the voice of a notice board and a stadium banner |
| All reading text and UI | **Noto Sans** | 400, 500, 600, 700 | Renders extended Latin (ɓ ɗ ƙ ɛ ɔ ŋ ẹ ọ ṣ) and pairs with Noto Ethiopic, Arabic, Tifinagh, N'Ko |
| Official documents only | **Noto Serif** | 400, 600 | Certificates, notices, letters. Never in product UI |
| Reference numbers, member IDs, timestamps, counts in logs | **JetBrains Mono** | 400, 500 | Easy to read and copy: `ML-2026-04417`, `S55-XXXXX-XXXXX-C`. Use `tabular-nums` on every figure |

```html
<!-- index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Noto+Sans:wght@400;500;600;700&family=Noto+Serif:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<!-- Only when the locale needs it: -->
<!-- &family=Noto+Sans+Ethiopic:wght@400;600   (Amharic, Tigrinya) -->
<!-- &family=Noto+Sans+Arabic:wght@400;600     (Arabic, RTL) -->
```

```css
:root {
  --font-display: "Archivo", "Arial Narrow", "Helvetica Neue", Arial, sans-serif;
  --font-sans:    "Noto Sans", "Segoe UI", Roboto, Arial, sans-serif;
  --font-serif:   "Noto Serif", Georgia, "Times New Roman", serif;
  --font-mono:    "JetBrains Mono", "Fira Code", ui-monospace, monospace;
}
/* Density: the whole product runs on a 14px root. Every rem size (h-10, text-sm, p-5) scales from it. */
html { font-size: 14px; }
body { font-family: var(--font-sans); font-size: 1rem; line-height: 1.5; color: var(--ink); background: var(--surface); -webkit-font-smoothing: antialiased; }
h1, h2, h3, .display, .label { font-family: var(--font-display); }
```

Low-data note: load only the weights listed. Use `font-display: swap` (already in the URL). Never load a fourth family.

### 4.2 Type scale

```css
/* Display (website hero only, one per page) */
.display-xl { font-size: clamp(3rem, 9vw, 8.25rem); font-weight: 800; line-height: .9;  letter-spacing: -0.03em; }
.display-l  { font-size: clamp(2.5rem, 6vw, 3.5rem); font-weight: 800; line-height: 1.05; letter-spacing: -0.015em; }

/* Headings (rem, so they scale from the 14px root). Product page titles use 700; website heroes use 800. */
h1 { font-size: clamp(1.75rem, 4vw, 2.25rem);   font-weight: 700; line-height: 1.2;  letter-spacing: -0.01em; }  /* about 25 to 31px */
h2 { font-size: clamp(1.5rem, 3.4vw, 1.875rem); font-weight: 700; line-height: 1.25; }
h3 { font-size: clamp(1.125rem, 2.4vw, 1.375rem); font-weight: 700; line-height: 1.3; }
h4 { font-family: var(--font-sans); font-size: 1.125rem; font-weight: 600; line-height: 1.4; }

/* Named steps (Tailwind): display-xs 24 / sm 30 / md 36 / lg 48 / xl 72 (rem; px at 16, scales with the root) */

/* Text */
.lead    { font-size: clamp(1.0625rem, 2vw, 1.25rem); line-height: 1.55; color: var(--ink-muted); }
p        { font-size: 1rem; line-height: 1.5; max-width: 68ch; }
.body-s  { font-size: .875rem; line-height: 1.43; }
.caption { font-size: .75rem; line-height: 1.33; font-weight: 500; color: var(--ink-muted); } /* never smaller than 12px */

/* Labels / eyebrows */
.label { font-family: var(--font-display); font-size: .75rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-muted); }

/* Official documents */
.official      { font-family: var(--font-serif); font-size: 1.75rem; font-weight: 600; line-height: 1.3; }
.official-body { font-family: var(--font-serif); font-size: 1.0625rem; line-height: 1.65; }

/* Buttons: text-sm (.875rem), weight 600 */
button { font-family: var(--font-sans); font-size: .875rem; font-weight: 600; letter-spacing: 0; }
```

**Rules:** sentence case everywhere. CAPITALS only for the wordmark and `.label`. Never justify text. Line length 45 to 75 characters. Never fake bold or italic Archivo for body text.

---

## 5. Layout & Spacing (Mobile-First)

### 5.1 Tokens

```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;  --space-5: 24px;
--space-6: 32px;  --space-7: 48px;  --space-8: 64px;  --space-9: 96px;

/* Radius (Tailwind): xs 4 / sm 6 / md 8 / lg 10 / xl 12 / 2xl 16 / 3xl 20 */
/*   rounded-lg   10px  tab triggers, icon chips (sm)
     rounded-xl   12px  buttons, inputs, selects, tab tracks, nav rows, icon buttons, alerts
     rounded-2xl  16px  cards, tiles, dialogs, table cards
     rounded-full       badges, switches, avatars
     weave tiles keep their own 2px corners */

/* Elevation: Earth-tinted, wide and soft. Cards rest on shadow-card and lift to card-hover. */
--shadow-1:          0 1px 2px rgba(30,20,16,.05), 0 1px 3px rgba(30,20,16,.08);        /* active tab pill, small chips */
--shadow-2:          0 4px 8px -2px rgba(30,20,16,.10), 0 2px 4px -2px rgba(30,20,16,.06); /* menus, toasts, drawer controls */
--shadow-3:          0 16px 40px rgba(30,20,16,.18), 0 4px 10px rgba(30,20,16,.08);     /* dialogs, drawers, ID card */
--shadow-card:       0 4px 16px rgba(30,20,16,.05);                                      /* every card at rest */
--shadow-card-hover: 0 10px 28px rgba(30,20,16,.09);                                     /* interactive cards on hover */

/* Control heights at the 14px root (rem in code: h-9 / h-10 / h-11) */
--control-s: 9  (2.25rem, about 32px)  /* sm: table rows, toolbars */
--control-m: 10 (2.5rem,  about 35px)  /* default buttons, inputs, selects */
--control-l: 11 (2.75rem, about 39px)  /* large: auth and website primary actions */
/* Touch rule: on coarse pointers (phones, tablets) every button, link and input has min-height 44px, set once in base CSS. Density never beats the touch target. */

--band-xs: 6px;  --band-s: 16px;  --band-m: 24px;  --band-l: 40px; /* weave band heights */
```

Depth order: the page (`--surface`) sits lowest, cards are raised white (`--surface-raised`) with a hairline `--line` border and `--shadow-card`, floating layers (menus, dialogs) use `--shadow-2` or `--shadow-3`. No coloured glows, no glassmorphism, no inner shadows.

### 5.2 Page structure

```jsx
<div className="min-h-screen bg-surface text-ink">
  <WeaveBand variant="thread" />                {/* 6px thread at the very top of every page */}
  <SiteHeader />
  <main id="main" className="pb-16 md:pb-24">
    <div className="w-full max-w-content mx-auto px-5 md:px-6 lg:px-10">   {/* max-w-content = 1280px */}
      {/* Content */}
    </div>
  </main>
  <SiteFooter />                                {/* Earth ground, weave band on top */}
</div>
```

### 5.3 Section spacing

```css
/* Website */
.section    { padding: 64px 0; }                     /* mobile */
@media (min-width: 1024px) { .section { padding: 120px 0; } }

/* Product: pages are a vertical stack with an 18 to 20px rhythm; KPI rows use gap-4, two-column rows use gap-[18px]. */
.stack-page { display: flex; flex-direction: column; gap: 20px; }

/* Horizontal padding: 20px mobile, 24px tablet, 40px desktop (marketing). The app shell uses p-4 md:p-8.
   Max content width 1280px. */
```

### 5.4 Grid patterns

```jsx
// Cards (communities, services)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

// Pillars (Community / Services / Voice)
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

// Hero: headline left, media right
<div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">

// Stat tiles
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

// Editorial modular grid (marketing)
<div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[230px] gap-3">
```

Desktop grid: 12 columns, 24px gutters. Editorial tiles: 12px gaps.

---

## 6. Graphic Language (brand graphics in code)

Every graphic comes from one idea: **the woven border**. Five square tiles, always in the same order, read like the edge of a cloth that holds the whole continent together. The weave links the three layers of the brand: the **logo** (the wordmark stands on it), the **layout** (it divides sections) and the **product** (the 6px thread tops every page, card and dialog).

There are exactly four graphic devices, all built from the same five tiles:

| Device | What it is | Where |
| --- | --- | --- |
| **Weave band** | The five tiles in a horizontal strip | Under the wordmark, page tops, section dividers, ID card, certificates |
| **Tile mosaic** | Whole tiles in a stepped grid | Heroes, slide covers, backs of cards, splash screens |
| **Chevron field** | The clay tile's chevron as a quiet repeat texture | Dark or clay backgrounds, campaign posters, social tiles |
| **Colour blocks** | The five tile colours as unequal vertical bands | Posters, stage backdrops, signage, the design system cover |

Anything else (maps of Africa, masks, animals, flags, generic "tribal" patterns, kente or mudcloth copies) is **not** part of the graphic language.

### 6.0 The five tiles

| # | Tile | Ground | Motif (line colour) | Meaning |
| --- | --- | --- | --- | --- |
| 1 | Clay chevron | `#B5381F` | Two chevrons (Sand) | Land and direction |
| 2 | Ochre triangle | `#E0A030` | Triangle in triangle (Earth) | Harvest, the hearth |
| 3 | Baobab spiral | `#1F6B45` | Square spiral (Sand) | The gathering, the long view |
| 4 | Sand diamond | `#F5EDE0` | Diamond in diamond (Earth) | Family, protection |
| 5 | Lake zigzag | `#0D6B64` | Three zigzag lines (Sand) | Movement, the diaspora |

- Each tile is drawn on a **24-unit square**, motif stroke **2 units**, mitred joins, with a **1-unit Earth seam** on its right edge when tiles sit side by side.
- The motifs are generic geometric forms shared across many African textile traditions. They are not copied from any one people's sacred or registered designs, and must not be swapped for such designs.
- The tile colours are **fixed**: they do not change in dark mode or for sub-brands.

### 6.1 The weave band (signature)

Five tiles, always in this order: **clay chevron, ochre triangle, baobab spiral, sand diamond, lake zigzag**. Motif lines are Earth on light tiles and Sand on dark tiles, with a 1-unit Earth seam.

**Sizes:**

| Token | Height | Variant | Use |
| --- | --- | --- | --- |
| `--band-l` | 40px | weave | Website section dividers, posters, slide footers, the cover |
| `--band-m` | 24px | weave | Under the wordmark at 56px+ |
| `--band-s` | 16px | weave | Product headers, footer top edge, under the wordmark at 24 to 55px |
| `--band-xs` | 6px | thread | Very top of every page, card tops, dialog tops, wordmark under 24px |

The **thread** is the band reduced to plain colour segments (clay, ochre, baobab, earth, lake) because motifs are unreadable under 16px. On dark grounds the earth segment becomes sand so it stays visible.

```jsx
// src/components/brand/WeaveBand.jsx
import { useId } from 'react';

const C = { clay: '#B5381F', ochre: '#E0A030', baobab: '#1F6B45', sand: '#F5EDE0', lake: '#0D6B64', earth: '#1E1410' };
export const TILES = [
  { bg: C.clay,   line: C.sand,  d: 'M3 10 L12 4 L21 10 M3 19 L12 13 L21 19' },
  { bg: C.ochre,  line: C.earth, d: 'M12 4 L20.5 19.5 H3.5 Z', fill: 'M12 11.5 L15.5 17.5 H8.5 Z' },
  { bg: C.baobab, line: C.sand,  d: 'M5 19 V5 H19 V19 H9 V9 H15 V15 H12' },
  { bg: C.sand,   line: C.earth, d: 'M12 3.5 L20.5 12 L12 20.5 L3.5 12 Z', fill: 'M12 9 L15 12 L12 15 L9 12 Z' },
  { bg: C.lake,   line: C.sand,  d: 'M3 8.5 L7.5 4.5 L12 8.5 L16.5 4.5 L21 8.5 M3 14 L7.5 10 L12 14 L16.5 10 L21 14 M3 19.5 L7.5 15.5 L12 19.5 L16.5 15.5 L21 19.5' },
];

export function Tile({ i, x = 0, y = 0, seam = true }) {
  const t = TILES[i % 5];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="24" height="24" fill={t.bg} />
      <path d={t.d} fill="none" stroke={t.line} strokeWidth="2" strokeLinejoin="miter" />
      {t.fill && <path d={t.fill} fill={t.line} />}
      {seam && <rect x="23" width="1" height="24" fill={C.earth} />}
    </g>
  );
}

/** variant "weave" for 16px+, "thread" (plain colour) under 16px. onDark swaps the thread's earth segment to sand. */
export function WeaveBand({ variant = 'weave', height, onDark = false, className = '' }) {
  const id = useId().replace(/:/g, '');
  if (variant === 'thread') {
    const h = height ?? 6, u = h * 4;
    const cols = [C.clay, C.ochre, C.baobab, onDark ? C.sand : C.earth, C.lake];
    return (
      <svg aria-hidden="true" width="100%" height={h} className={`block ${className}`}>
        <defs><pattern id={`t${id}`} width={u * 5} height={h} patternUnits="userSpaceOnUse">
          {cols.map((c, i) => <rect key={i} x={i * u} width={u} height={h} fill={c} />)}
        </pattern></defs>
        <rect width="100%" height={h} fill={`url(#t${id})`} />
      </svg>
    );
  }
  const h = height ?? 24;
  return (
    <svg aria-hidden="true" width="100%" height={h} className={`block ${className}`}>
      <defs><pattern id={`w${id}`} width="120" height="24" patternUnits="userSpaceOnUse" patternTransform={`scale(${h / 24})`}>
        {TILES.map((_, i) => <Tile key={i} i={i} x={i * 24} />)}
      </pattern></defs>
      <rect width="100%" height={h} fill={`url(#w${id})`} />
    </svg>
  );
}
```

**Where it goes:** under the wordmark; 6px thread at the top of every page, card (`band` prop) and dialog; between major website sections (40px); along the bottom of the ID card and certificates.
**Rules:** max two bands per screen, horizontal only, full container width, never text on it, never recolour, reorder, rotate or half-crop a tile.

### 6.2 Tile mosaic (heroes, covers, card backs)

```jsx
export function TileMosaic({ cols = 6, rows = 8, offset = 0, gap = 1.5, className = '' }) {
  const W = cols * (24 + gap) - gap, H = rows * (24 + gap) - gap;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className={className}>
      {Array.from({ length: rows }).flatMap((_, r) =>
        Array.from({ length: cols }).map((_, c) =>
          <Tile key={`${r}-${c}`} i={c + r * 2 + offset} x={c * (24 + gap)} y={r * (24 + gap)} seam={false} />))}
    </svg>
  );
}

// Hero usage: bleeds off the top right, fades into Earth under the text
<section className="relative overflow-hidden section-dark">
  <TileMosaic className="absolute -right-14 -top-8 w-[46%] max-w-[620px]" />
  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,#1E1410_42%,rgba(30,20,16,.55)_62%,rgba(30,20,16,.1))]" />
  <div className="relative">{/* headline */}</div>
</section>
```

**How it is built:** whole tiles (no seams) with 1.5-unit gaps; the tile order steps **two places per row**, like a repeat on a loom, so diagonals of the same colour run across the grid.

Rules: one mosaic per view, always bleeds off an edge (top right by default), always faded into Earth behind text, never with text placed directly on tiles. On mobile drop to 40% opacity or hide it. Skip it entirely in Low-data mode.

Common placements:
- **Website hero:** 6 x 9 tiles, top right, about 46% of the width.
- **Slide cover:** 5 x 6 tiles, top right, about 34% of the width, Earth fade from the left.
- **Business card / ID card back:** 4 x 3 tiles, bottom right corner, about 34% of the width.
- **Editorial grid tile:** fills one tile of the modular grid, bleeding off its own edges.

### 6.3 Chevron field (texture)

The clay tile's chevron repeated as a quiet texture on Earth or Clay grounds.

```jsx
// src/components/brand/ChevronField.jsx
export function ChevronField({ color = '#E0A030', opacity = 0.22, pitch = 28, className = '' }) {
  const w = 600, h = 320, rows = Math.ceil(h / pitch) + 2;
  const d = Array.from({ length: rows }, (_, r) => {
    const y = r * pitch;
    let p = `M0 ${y + 12}`;
    for (let x = 0; x < w + pitch * 2; x += pitch * 2) p += ` L${x + pitch} ${y} L${x + 2 * pitch} ${y + 12}`;
    return p;
  }).join(' ');
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className={`absolute inset-0 w-full h-full ${className}`}>
      <path d={d} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth="3" strokeLinejoin="miter" />
    </svg>
  );
}

// Usage: on a clay campaign tile
<div className="relative overflow-hidden rounded-2xl bg-clay p-8 text-ivory">
  <ChevronField color="#E0A030" opacity={0.28} />
  <h3 className="relative font-display text-3xl font-extrabold">Consultation open</h3>
</div>
```

Rules: opacity 18 to 28%; ochre lines on clay or Earth, sand lines on baobab or lake; never on Ivory or white; never behind body text (headlines and short labels only); one field per view.

### 6.4 Colour blocks

The five tile colours at architectural scale: unequal vertical bands, like warp threads on a loom.

```jsx
// src/components/brand/ColourBlocks.jsx
const BLOCKS = [['#B5381F', 3], ['#E0A030', 1.4], ['#1F6B45', 2], ['#F5EDE0', 1], ['#0D6B64', 1.6]];

export function ColourBlocks({ className = '' }) {
  return (
    <div aria-hidden="true" className={`flex h-full ${className}`}>
      {BLOCKS.map(([c, f]) => <i key={c} className="block h-full" style={{ background: c, flex: f }} />)}
    </div>
  );
}
```

Rules: always in tile order, always vertical, always unequal widths (clay widest, sand narrowest), full height of the frame. Posters, stage backdrops, building signage, covers. Not in product UI.

### 6.4b Editorial modular grid (the signature composition)

The marketing composition that combines the devices: a grid of 16px-cornered tiles mixing photography, product proof, bold type and the weave.

```jsx
<div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[230px] gap-3">
  <PhotoSlot className="row-span-2" label="Portrait, community leader, Kitwe" />          {/* 1 photo */}
  <div className="bg-white rounded-2xl p-5 shadow-3">{/* UI proof: request card, Verified badge */}</div>
  <div className="col-span-2 rounded-2xl p-7 flex items-end bg-clay">
    <p className="font-display font-extrabold text-4xl leading-none text-ivory">One Africa.<br />One home.<br />One voice.</p>
  </div>                                                                                  {/* 1 type tile, flat clay */}
  <div className="rounded-2xl border border-white/15 p-5 flex flex-col">{/* data tile: label + big ochre number */}</div>
  <div className="rounded-2xl overflow-hidden bg-earth"><TileMosaic className="w-[140%]" /></div> {/* weave tile */}
  <div className="rounded-2xl bg-ivory p-5 flex flex-col"><Wordmark size={26} /></div>   {/* wordmark tile */}
</div>
```

Rules: every composition has **one photo, one type tile and one proof tile** (UI or data); **one gradient tile at most**; one mosaic tile at most; let one tile dominate. Tiles keep 16px corners, 12px gaps. Alternate Earth and Ivory sections with 96px between them.

### 6.4c Graphic language do / don't

**Do**
- Keep the five tiles in order: clay, ochre, baobab, sand, lake.
- Let mosaics, chevron fields and colour blocks bleed off the edge of the frame.
- Use at most two bands, one mosaic and one chevron field per view.
- Fade graphics into Earth wherever text sits nearby.

**Don't**
- Put text on the band, the mosaic or individual tiles.
- Recolour, reorder, rotate, skew, outline or half-crop a tile.
- Use a single motif on its own as an icon, bullet or decoration.
- Run the band vertically in product UI.
- Animate tiles (no spinning, sliding or shimmering weave).
- Add maps of Africa, masks, animals, flags or other pattern styles.

### 6.5 Wordmark (the logo)

```jsx
// src/components/brand/Wordmark.jsx
export function Wordmark({ size = 32, tone = 'ink', band = true, descriptor }) {
  const color = { ink: 'var(--ink)', inverse: 'var(--ink-inverse)', brand: 'var(--brand)' }[tone];
  const onDark = tone === 'inverse';
  return (
    <div role="img" aria-label="Motherland" className="inline-flex flex-col leading-none" style={{ fontSize: size, gap: '.22em' }}>
      <span aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '.14em', marginRight: '-.14em', color, whiteSpace: 'nowrap' }}>MOTHERLAND</span>
      {band && <div style={{ marginRight: '.14em' }}>
        {size >= 24 ? <WeaveBand height={Math.max(10, Math.round(size * .42))} /> : <WeaveBand variant="thread" onDark={onDark} />}
      </div>}
      {descriptor && <span aria-hidden="true" style={{ fontSize: '.3em', fontWeight: 600, letterSpacing: '.32em', textTransform: 'uppercase', color }}>{descriptor}</span>}
    </div>
  );
}
```

- Clear space = height of the M on every side. Minimum 16px cap height on screen, 20mm in print.
- Tones: `ink` on light, `inverse` on dark, `brand` (clay) only on ivory or sand for ceremonial use.
- Descriptors: "Community", "Services", "Voice", "ID", "One Africa".
- **Do not:** use another font, change tracking, stretch, outline, add shadows, put it on a busy photo without a solid block, or design a symbol or M monogram.

---

## 7. Components

Controls follow the compact scale (36 to 40px at the 14px root) and grow to a 44px minimum on touch devices (coarse pointers). Build with the shared primitives in `components/ui` and the page furniture in `components/shared` (section 7.12) rather than hand-rolling classes. Focus ring on every interactive element:

```css
:where(button, a, input, select, textarea, [role="tab"], [role="switch"]):focus-visible {
  outline: 2px solid var(--focus); outline-offset: 2px;
}
```

### 7.1 Buttons

```jsx
const base = 'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

// Primary (clay, gradient fill): ONE per view, for the thing the screen exists to do
<button className={`${base} btn-cta text-on-brand`}>Join community</button>

// Secondary
<button className={`${base} bg-surface-raised text-ink border border-line-strong hover:bg-surface-sunken`}>View details</button>

// Ghost (cancel, low weight)
<button className={`${base} bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink`}>Cancel</button>

// Accent (ochre): membership and upgrade moments only
<button className={`${base} bg-accent text-on-accent`}>Upgrade membership</button>

// Danger: destructive only
<button className={`${base} bg-danger text-white`}>Withdraw request</button>

// Sizes: h-9 px-3 (sm, tables and toolbars) · h-10 px-4 (default) · h-11 px-6 text-base (lg, auth and website) · h-10 w-10 (icon)
// Icon-only row actions use <ActionIconButton icon label />, which requires a label (aria-label + tooltip).
```

Labels: verb first, 1 to 3 words, sentence case ("Send code", "Track request"). Never "Submit" alone, "Click here" or an exclamation mark. Icon-only buttons need `aria-label`.

### 7.2 Form fields

```jsx
export function Field({ id, label, hint, error, optional, ...props }) {
  const describedBy = error || hint ? `${id}-help` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}{optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      <input id={id} aria-invalid={!!error} aria-describedby={describedBy}
        className={`h-10 px-3 rounded-xl bg-surface-sunken text-ink text-sm placeholder:text-ink-muted transition-colors
          border ${error ? 'border-2 border-danger' : 'border-line-strong'} focus:border-focus focus:bg-surface-raised`} {...props} />
      {error
        ? <p id={`${id}-help`} className="flex gap-1 text-sm text-danger"><TriangleAlert size={16} className="mt-0.5" />{error}</p>
        : hint && <p id={`${id}-help`} className="text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}
```

- Labels always visible above the field. Placeholders show **format only** (`+260 97 123 4567`), never instructions.
- Errors say what happened and how to fix it: "Check the number. It has 6 digits, then 2, then 1."
- Inputs are a sand-filled well with a visible `--line-strong` border (so the 3:1 input-border contrast rule holds) that turns white on focus. Never a borderless fill.
- On touch devices input text is at least 16px so iOS does not zoom: the base CSS bumps inputs to 16px on coarse pointers.
- Phone fields: `type="tel"`, `inputMode="tel"`, `autoComplete="tel"`, default country from the user's locale.
- OTP: `inputMode="numeric"`, `autoComplete="one-time-code"`, 6 digits.
- Radios for under 5 options, select for 5 to 15, searchable combobox above 15. Checkbox ticked = clay fill, switch on = baobab.

### 7.3 Card

```jsx
<section className="card-elevated bg-surface-raised border border-line rounded-2xl overflow-hidden">  {/* shadow-card, lifts on hover */}
  {band && <WeaveBand variant="thread" />}           {/* only for cards that ARE Motherland: communities, membership */}
  <div className="p-5 flex flex-col gap-2">
    <div className="label">Community</div>           {/* eyebrow: the kind of thing */}
    <h3 className="text-lg font-bold font-display">Lusaka Tech Circle</h3>  {/* the thing */}
    <p className="text-ink-muted">2,140 members. Weekly meetups at BongoHive, Thornpark.</p>
  </div>
  <div className="px-5 py-3 border-t border-line flex justify-end gap-2">{/* actions */}</div>
</section>
```

Cards are 16px, hairline-bordered and softly shadowed. Never use left-border accent cards or emoji cards. Interactive cards may lift 2 to 3px on hover (marketing and KPI tiles only, never rows in a list).

### 7.4 Badge (status)

| Tone | Classes | Meaning |
| --- | --- | --- |
| neutral | `bg-surface-sunken text-ink ring-1 ring-line` | Draft |
| brand | `bg-brand-soft text-brand-strong` | New |
| accent | `bg-accent-soft text-accent-strong` | Membership tier |
| success | `bg-success-soft text-success` + check icon | Verified, approved |
| info | `bg-info-soft text-info` | In review, in progress |
| danger | `bg-danger-soft text-danger` + alert icon | Action needed |

Shape: `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold` (a soft pill, 12px text). One or two words. Map statuses to tones in one place (`StatusBadge`), never inline.

### 7.5 Stat tile (KpiTile)

```jsx
<div className="card-elevated bg-surface-raised border border-line rounded-2xl px-5 py-4 flex flex-col gap-3">
  <div className="flex items-center justify-between">
    <span className="label">Members</span>
    <IconChip icon={<Users size={18} />} tone="brand" size="sm" />   {/* soft tinted square */}
  </div>
  <div className="font-display text-display-xs font-bold tabular-nums text-ink">48,210</div>
  <div className="text-xs text-ink-muted">+1,320 this month</div>
</div>
```

Stat tiles are flat white with a tinted icon chip and a solid number. No gradient fills. Loading shows a sand shimmer where the number goes.

### 7.6 Tabs

Segmented pills: a sand track (`bg-surface-sunken rounded-xl p-1`), triggers `rounded-lg px-3.5 py-1.5 text-xs font-semibold`, and a white pill (`shadow-1`) that slides to the active tab (`PillTabBar`, framer `layoutId`). Use `role="tablist"`, `role="tab"`, `aria-selected`. 2 to 5 tabs. Tab panels fade up 10px on switch.

### 7.7 Dialog

- Thread band on top, title is the question ("Withdraw this request?"), body says what will happen, actions bottom right: safe action left (ghost), committing action right.
- Use a real focus trap (Radix Dialog or `<dialog>` with `showModal()`), close on Escape, return focus to the trigger.
- Scrim: `rgba(30,20,16,.55)`. Panel `rounded-2xl shadow-3 p-6`, max width 480px, `max-h-[90vh]` scrolling inside. Full-screen sheet on mobile.

### 7.12 Page furniture (`components/shared`)

Every product page is assembled from these. If a page needs something that is not here, add it here first, then use it.

| Component | What it is | Key rules |
| --- | --- | --- |
| `PageTransition` | 10px fade-up, 350ms, spring curve | Wraps the routed page once, in the shell. Skipped under reduced motion |
| `PageHeader` | Eyebrow, title (`display-sm`), one-line subtitle, right-hand actions, optional back button | One per page. At most one primary button in `action` |
| `SectionCard` | White 16px surface with an optional titled header (`px-5 py-4`, hairline rule) and `p-5` body | `featured` adds the weave thread. Use `contentClassName="p-0"` for edge-to-edge tables |
| `KpiTile` | Label, icon chip, tabular number, caption | Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`. Lifts 2px on hover when it is a link |
| `IconChip` | Icon on a soft tinted square, 32 / 40 / 48px | Tones: brand, accent, success, info, danger, neutral. Always `aria-hidden` |
| `StatusBadge` | Pill from one status map: label, tone, icon | Add statuses to the map, never inline. Unknown values fall back to neutral |
| `EmptyState` | Neutral icon chip, title, one sentence, optional action | Says what the place is for plus one action |
| `SectionBody` | Loading skeleton, error with "Try again", empty text, or children | One card failing must not blank the page. Each card loads independently |
| `TableLoadingSkeleton` | Same-shape table skeleton | Keeps layout stable while data loads |
| `DataTablePagination` | Range on the left, previous and next on the right | Lives in the table card's footer |
| `PillTabBar` | Sliding-pill segmented tabs | Give each bar on a page its own `layoutId` |
| `ActionIconButton` | 36px icon-only row action | `label` is required (aria-label and tooltip) |

Page recipe:

```jsx
<PageHeader eyebrow="Admin" title="Users" subtitle="People who can sign in." action={<Button>Invite user</Button>} />
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{/* KpiTile x4 */}</div>
<SectionCard className="mt-5" contentClassName="p-0">
  {/* filter bar: search + selects, all h-10, flex-wrap, search flex-1 min-w-48 */}
  {/* Table, or TableLoadingSkeleton / EmptyState / error via SectionBody */}
  <DataTablePagination page={page} limit={limit} total={total} onChange={setPage} />
</SectionCard>
```

Tables: header cells `h-11`, 11px bold capitals, `tracking-wider`, `text-ink-muted` on the raised surface; rows `border-b border-line`, hover `bg-surface-sunken`; cells `px-3 py-3 lg:px-4 lg:py-4`. Reference numbers, member IDs and timestamps use `font-mono tabular-nums`.

### 7.8 Toast

Title in 2 to 4 words plus one sentence with a reference or the next step. Success, info and warning auto-close after 6s; danger stays until dismissed and uses `role="alert"`. Position bottom-centre on mobile, bottom-right on desktop.

### 7.9 Request tracker (Services signature pattern)

```jsx
const steps = [
  { label: 'Submitted', date: 'Mon 3 Nov, 09:14', state: 'done' },
  { label: 'Documents verified', date: 'Wed 5 Nov', state: 'done' },
  { label: 'With the district office', date: 'Usually 5 working days', state: 'current' },
  { label: 'Ready for collection', date: 'We will SMS you', state: 'upcoming' },
];
// done = baobab filled circle + check · current = info ring (or ochre glow on dark) · upcoming = line-strong outline
// Vertical on mobile, horizontal on desktop. Always show the reference number above it.
```

### 7.10 Navigation

- **Mobile app:** bottom nav with 4 items max (Home, Communities, Services, Me), icon + label, active = clay, 44px+ targets, `aria-current="page"`.
- **Desktop app shell:** `h-screen` with only `<main>` scrolling; a 6px thread on top; a 250px white sidebar (72px collapsed, icon-only with tooltips) with a slim 56px top bar over the content; content in `max-w-content` on the page ground with `p-4 md:p-8`. Below 1024px the sidebar becomes a slide-in drawer.
  - Wordmark (18px) with a descriptor at the top. Nav is **grouped** (Overview, People, Records…) with collapsible group labels (11px capitals, chevron rotates), entries filtered by permission.
  - Nav row: `h-11 rounded-xl px-3.5 text-sm font-semibold`, 20px icon. Active = `bg-brand-soft text-brand-strong` plus a 4 x 20px clay bar that slides between rows. Inactive = `text-ink-muted`, hover = sunken fill.
  - User block pinned to the bottom: avatar, name, email, then Account and Sign out as quiet ghost buttons.
  - Pages animate in with `PageTransition` (10px fade-up, 350ms).
- **Website header:** thread band, then wordmark (24px) left, links (Community, Services, Voice, State 55) and "Sign in" (secondary) + "Join" (primary) right. Collapses to a menu button under 768px.
- **Footer:** Earth ground, 16px weave band on top, wordmark inverse, three link columns, legal line `[LEGAL ENTITY NAME] · [REGISTERED ADDRESS]`.

### 7.11 Membership ID card

85.6 x 54mm ratio (`aspect-[85.6/54]`), Earth ground, inverse wordmark (no band) top left, ochre tier tag top right, photo + name (Archivo 800) + community, member number + "since" year, 20px weave band along the bottom edge, `rounded-2xl shadow-3`.

---

## 8. Icons

- **Library:** `lucide-react`. Outline only, `strokeWidth={2}`, round caps and joins, `currentColor`.
- **Sizes:** 16 inline, 20 UI default, 24 navigation, 32+ marketing features inside a 48px `bg-brand-soft`, `bg-success-soft` or `bg-accent-soft` tile.
- **Core set:** House, Users, Landmark, IdCard, ShieldCheck, Globe, Bell, Search, ChevronRight, ChevronDown, Check, X, Info, TriangleAlert, CircleCheck, FileText, MessageCircle, Settings, Plus, ArrowRight, MapPin, Calendar, Vote, HeartHandshake, Megaphone, User, LogOut, Menu.
- **Pillar icons:** Community = `Users`, Services = `Landmark`, Voice = `Megaphone`, ID = `IdCard`.
- Decorative icons: `aria-hidden="true"`. Standalone icons: inside a button with `aria-label`.
- **Never:** emoji, flags as icons, filled or duotone icons, mixing icon libraries, African-motif clip art.

```jsx
import { Landmark } from 'lucide-react';
<Landmark size={20} strokeWidth={2} aria-hidden="true" />
```

---

## 9. Animations

```jsx
import { motion, useReducedMotion } from 'framer-motion';

export function FadeIn({ children, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.7, 0.2, 1] }}
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  );
}
```

| Motion | Duration | Notes |
| --- | --- | --- |
| Hover, colour, focus | 150ms | `transition-colors` only |
| Hover lift (KPI tiles, marketing cards) | spring (stiffness 400, damping 28) | `y: -2` to `-4`, shadow grows from card to card-hover. Never on rows in a list |
| Press feedback (buttons, tabs) | 100 to 150ms | `active:scale-[0.98]` |
| Sliding indicators (nav bar, tab pill) | spring (stiffness 500+, damping 30+) | Framer `layoutId`. Shows what changed |
| App page entrance | 350ms | Fade + 10px rise on the spring curve (`PageTransition`) |
| Marketing section entrance | 500 to 600ms | Fade + 24px rise, once |
| Collapsible groups | 220ms | Height and opacity, chevron rotates 180deg |
| Skeletons | 1.8s loop | Sand shimmer (`.skeleton`), shaped like the content it replaces |
| Stagger | 60 to 80ms per item | Max 6 items, then no stagger |
| Dialog / sheet | 200ms in, 150ms out | Fade + 8px scale or slide up |
| Tracker current step | 1.6s pulse | Ring glow, stops under reduced motion |

One easing curve everywhere: `cubic-bezier(0.16, 1, 0.3, 1)` (`ease-spring`). Rules: no bounce or overshoot, no parallax, no autoplaying carousels, no animation of rows in main lists. Use Framer Motion for the shell, sliding indicators, tiles and key moments; plain CSS transitions for colour and shadow. Every motion respects `prefers-reduced-motion` (`useReducedMotion`) and Save-Data.

---

## 10. Mobile-First, Low-Data, Real Conditions

### Start small, scale up
Base styles target **360px** (also check 320px). Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.

### Performance budget (this matters more than polish)
- First load JS under **170 KB gzipped** for the app shell. Route-split everything else (`React.lazy`).
- Largest Contentful Paint under 2.5s on a mid-range Android over 3G.
- Images: AVIF/WebP with JPEG fallback, `loading="lazy"`, explicit `width`/`height`, max 120 KB for a hero.
- No video backgrounds. No heavy icon packs (import Lucide icons individually).
- Respect `navigator.connection.saveData`: skip mosaics, motion and non-essential images.
- Offer a **Low-data mode** switch in settings that does the same.

### Offline and failure states
- Cache the shell and the member's own requests (service worker / Workbox).
- Forms save drafts locally and say so: "Saved on this phone. We will send it when you are back online."
- Every network error offers a retry and, where possible, an alternative (USSD code, SMS, visit a Motherland desk).

### Responsive images
```jsx
<picture>
  <source type="image/avif" srcSet="/img/hero-640.avif 640w, /img/hero-1280.avif 1280w" sizes="(max-width: 768px) 100vw, 50vw" />
  <source type="image/webp" srcSet="/img/hero-640.webp 640w, /img/hero-1280.webp 1280w" sizes="(max-width: 768px) 100vw, 50vw" />
  <img src="/img/hero-1280.jpg" alt="A market trader in Lusaka checks a request on her phone" width="1280" height="1600" loading="lazy" className="w-full h-auto rounded-lg" />
</picture>
```

### Touch targets
```css
button, a, [role="button"], input, select { min-height: 44px; }
.icon-button { min-width: 44px; }
```

---

## 11. Language, Locale and Formatting

- **Launch languages:** English, French, Portuguese, Kiswahili, Arabic. Then local languages per country (Ichibemba, Chinyanja, Hausa, Yoruba, isiZulu, Amharic and others).
- **Design for 40% text expansion** (French and Portuguese run long). Never fix button widths.
- **RTL (Arabic):** set `dir="rtl"` on `<html>`; use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`); mirror chevrons and arrows, never the weave band or logos.
- **Never hard-code strings.** Use an i18n library (`react-i18next` or `@lingui/react`) from day one.
- **Numbers and money:** `Intl.NumberFormat`. Currency code before the amount: `ZMW 150.00`, `KES 2,500.00`, `NGN 12,000.00`.
  ```js
  const money = (v, cur, loc = navigator.language) =>
    new Intl.NumberFormat(loc, { style: 'currency', currency: cur, currencyDisplay: 'code' }).format(v);
  ```
- **Dates:** `Intl.DateTimeFormat`, short and explicit: "Fri 28 Nov", "Mon 3 Nov, 09:14". 24-hour time. Never ambiguous `03/11`.
- **Reference numbers:** `ML-YYYY-NNNNN` (e.g. `ML-2026-04417`), monospace-friendly, copyable with one tap.
- **Phone numbers:** E.164 storage (`+260971234567`), display with spaces (`+260 97 123 4567`).
- **Names:** one "Full name" field, not first/last. Do not assume Western name order. Allow diacritics and apostrophes.
- **Greetings:** localised where known ("Mwashibukeni, Thandiwe" in Bemba). Fallback "Hello, Thandiwe".

---

## 12. Voice & Microcopy

### Principles
1. **Plain first:** one idea per sentence, for a second-language reader on a small screen.
2. **Respectful, never deferential:** members as equals, authorities as peers.
3. **Show the receipt:** reference, date, next step.
4. **Proud, not loud:** no exclamation marks, superlatives or slogans about "rising".
5. **We, together:** "we" is Motherland and its members, "you" is the member. Never "users".

### Patterns
| Element | Pattern | Example |
| --- | --- | --- |
| Headline | Short declarative, full stop | "Your request is with the district office." |
| Eyebrow | 1 to 2 words, label caps | "SERVICE REQUEST" |
| Button | Verb first, 1 to 3 words | "Track request" |
| Error | What happened + how to fix | "Airtel Money did not confirm. Try again or use another wallet." |
| Empty state | What this place is for + one action | "No communities yet. Find one near you." |
| Success | What happened + reference + next step | "Application received. Ref ML-2026-04417. We will SMS you at each step." |

### Say this, not that
| Say | Not |
| --- | --- |
| Join Motherland | Sign up now! |
| Your application is with the Lusaka district office. | Your request is being processed. |
| We could not confirm your payment. | Oops! Something went wrong. |
| Community | Tribe |
| Public services | Government stuff |
| Withdraw request | Cancel |

### Banned
revolutionary, seamless, cutting-edge, AI-powered, empower, game-changer, Africa rising, tribe, tribal, dark continent, third world, users, oops, **em dashes**, **emoji**, **exclamation marks in the product**.

---

## 13. Photography & Imagery

- Real Africans in real places doing ordinary things Motherland makes easier: a trader checking a request, a youth group planning a clean-up, a nurse renewing a licence, a grandmother on a call to the diaspora, a ward town hall, a farmer co-op logging produce.
- Daylight, eye level, unposed. Groups as often as individuals. Many countries, ages and abilities across a set.
- Warm, true skin tones. No heavy filters, no black-and-white people, no blue tints.
- Text over photos: a solid `--surface-inverse` block or `--gradient-photo-protect`.
- **Never:** safari animals, acacia sunsets, drum circles, poverty or "aid" imagery, stock handshakes, staged laptops, maps of Africa, masks, flags as decoration.
- **Placeholders** describe the shot, they never fake it:
  ```jsx
  <div className="aspect-[4/5] rounded-lg bg-surface-sunken border border-dashed border-line-strong flex items-end p-4 text-sm text-ink-muted">
    [PHOTO] Market trader in Lusaka checks a request status between customers. Daylight, eye level, candid.
  </div>
  ```
- Never use AI-generated images of identifiable real people, and never present illustrations as real members.

---

## 14. Accessibility (WCAG 2.2 AA)

- Contrast per section 2.4, in both themes.
- Visible focus ring on everything (`--focus`, 2px, offset 2px). Never `outline: none` without a replacement.
- Semantic HTML: `<header>`, `<nav>`, `<main id="main">`, `<section>`, `<footer>`, real `<button>`, `<a href>`, `<label>`.
- "Skip to content" link as the first focusable element.
- Every status uses colour + icon + text. Every icon-only control has `aria-label`.
- Forms: `aria-invalid`, `aria-describedby` for help and error text, error summary at the top of long forms.
- Live regions: toasts `role="status"`, errors `role="alert"`.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Support 200% zoom and text-only resizing without horizontal scroll.
- Test with TalkBack on Android (the main platform), then VoiceOver.

---

## 15. Dark Mode

- Set `data-theme="dark"` on `<html>`; default to `prefers-color-scheme`, let members override in settings and remember it.
- Components only use semantic tokens, so they flip automatically.
- Brand fills lighten in dark (`--brand` becomes `#E0613F`), and text on brand becomes Earth.
- The weave band and mosaic keep their fixed colours in both themes. The thread uses `onDark` on dark grounds.

---

## 16. Vite Setup Essentials

### Dependencies (pin exact versions in the lockfile)
```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router-dom": "6.28.0",
    "framer-motion": "11.11.17",
    "lucide-react": "0.460.0",
    "@radix-ui/react-dialog": "1.1.2",
    "@radix-ui/react-tabs": "1.1.1",
    "@radix-ui/react-tooltip": "1.1.4",
    "react-i18next": "15.1.1",
    "i18next": "23.16.8",
    "clsx": "2.1.1"
  },
  "devDependencies": {
    "vite": "5.4.11",
    "@vitejs/plugin-react": "4.3.4",
    "tailwindcss": "3.4.15",
    "postcss": "8.4.49",
    "autoprefixer": "10.4.20",
    "vite-plugin-pwa": "0.21.0"
  }
}
```

### Tailwind config
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      colors: {
        surface: { DEFAULT: 'var(--surface)', raised: 'var(--surface-raised)', sunken: 'var(--surface-sunken)', inverse: 'var(--surface-inverse)' },
        ink: { DEFAULT: 'var(--ink)', muted: 'var(--ink-muted)', inverse: 'var(--ink-inverse)' },
        line: { DEFAULT: 'var(--line)', strong: 'var(--line-strong)' },
        brand: { DEFAULT: 'var(--brand)', strong: 'var(--brand-strong)', soft: 'var(--brand-soft)' },
        'on-brand': 'var(--on-brand)',
        accent: { DEFAULT: 'var(--accent)', strong: 'var(--accent-strong)', soft: 'var(--accent-soft)' },
        'on-accent': 'var(--on-accent)',
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
        info: { DEFAULT: 'var(--info)', soft: 'var(--info-soft)' },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
        focus: 'var(--focus)',
        clay: '#B5381F', ochre: '#E0A030', baobab: '#1F6B45', lake: '#0D6B64', earth: '#1E1410', sand: '#F5EDE0', ivory: '#FBF7F0',
      },
      fontFamily: {
        display: ['Archivo', '"Arial Narrow"', 'Arial', 'sans-serif'],
        sans: ['"Noto Sans"', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xs: '4px', sm: '6px', md: '8px', lg: '10px', xl: '12px', '2xl': '16px', '3xl': '20px' },
      boxShadow: { 1: 'var(--shadow-1)', 2: 'var(--shadow-2)', 3: 'var(--shadow-3)', card: 'var(--shadow-card)', 'card-hover': 'var(--shadow-card-hover)', cta: 'var(--shadow-cta)' },
      maxWidth: { content: '1280px' },
      transitionTimingFunction: { spring: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
};
```

Raw palette colours (`clay`, `ochre` and the rest) exist for brand graphics only. Product UI uses the semantic names.

### Folder structure
```
src/
  styles/        tokens.css  base.css  (import order: tokens, base, tailwind)
  components/
    brand/       Wordmark.jsx  WeaveBand.jsx  TileMosaic.jsx  ChevronField.jsx  ColourBlocks.jsx  IdCard.jsx
    ui/          Button  Input  Select  Card  Badge  Table  Tabs  Dialog  Toast  (primitives, shadcn-based)
    shared/      PageHeader  SectionCard  KpiTile  IconChip  StatusBadge  EmptyState  SectionBody
                 TableLoadingSkeleton  DataTablePagination  PillTabBar  ActionIconButton  PageTransition
    patterns/    RequestTracker  PhotoSlot
  features/      community/  services/  voice/  id/
  i18n/          en.json  fr.json  pt.json  sw.json  ar.json
  lib/           format.js (money, dates, phone)  theme.js
```

---

## 17. Helpful Patterns

**Section toggle (website):**
```jsx
<section className="py-16 lg:py-[120px] bg-surface">...</section>
<section className="py-16 lg:py-[120px] section-dark">...</section>   {/* flat Earth */}
<section className="py-16 lg:py-[120px] bg-white">...</section>
```

**Section header (brand guide / marketing):**
```jsx
<div className="grid grid-cols-1 lg:grid-cols-[80px_1fr_1fr] gap-3 lg:gap-6 items-center mb-12 lg:mb-16">
  <span className="font-display font-bold text-[13px] tracking-[.1em] text-brand">04</span>
  <h2 className="font-display font-extrabold text-5xl lg:text-7xl tracking-[-.02em] leading-[.95]">Colour</h2>
  <p className="text-ink-muted text-[17px]">Short intro that says why this section matters.</p>
</div>
```

**Empty state:**
```jsx
<div className="text-center py-12 flex flex-col items-center gap-3">
  <div className="w-12 h-12 rounded-xl bg-brand-soft text-brand-strong grid place-items-center"><Users size={24} aria-hidden="true" /></div>
  <h3 className="font-display text-xl font-bold text-ink">No communities yet</h3>
  <p className="text-ink-muted">Find people from your town, school or trade.</p>
  <button className="... primary">Find a community</button>
</div>
```

**Loading skeleton (Sand shimmer, not grey; use the `.skeleton` class):**
```jsx
<div className="space-y-4" aria-busy="true" aria-label="Loading">
  <div className="skeleton h-10" />
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
  </div>
</div>
```

**Sample data (use real, local, clearly sample content, never lorem ipsum):**
- People: Thandiwe Banda, Chanda Mwila, Amara Okeke, Wanjiru Kamau, Kofi Mensah
- Places: Lusaka, Kitwe, Ndola, Lilongwe, Nairobi, Accra, Lagos, Johannesburg (diaspora)
- Communities: Lusaka Tech Circle, Matero Residents, Copperbelt Farmers Co-op
- Services: Birth certificate replacement, Passport renewal, Business name registration
- Money: ZMW, KES, NGN, GHS, ZAR, always with the code
- Unknown facts go in brackets: `[FEE]`, `[LEGAL ENTITY NAME]`, `[QR]`

---

## 18. AI Do / Don't (read before generating anything)

**Do**
- Use semantic tokens and the components above; read the design system README for anything missing.
- Put the thread band at the top of every page and the wordmark on its weave band.
- Lead with Earth, Clay and Ochre; alternate light and Earth sections.
- Write plain, receipt-first copy; localise numbers, money, dates.
- Build mobile and low-data first; add reduced-motion and dark-mode support.

**Don't**
- Invent a logo, a symbol, an M monogram or a State 55 mark.
- Use blue, purple, neon or rainbow colours or gradients; glassmorphism; coloured glows; left-border accent cards.
- Put a gradient anywhere except the primary button fill (not on cards, stat tiles, headings, display words or backgrounds).
- Mix corner sizes: controls are 12px, cards 16px, pills for badges. No 2 to 6px corners on UI.
- Hand-build a page header, card, KPI tile, empty state or status badge when a shared one exists.
- Use maps of Africa, masks, animals, flags or generic "tribal" patterns as decoration. The weave is the only pattern.
- Use emoji, exclamation marks, em dashes or banned words.
- Put text on the weave band, recolour or reorder its tiles, or use more than two bands per screen.
- Use ochre for text on light backgrounds.
- Hard-code strings, hex values in components, or fixed widths on buttons.
- Fabricate statistics, testimonials, partner logos or government facts. Use bracketed placeholders.

---

## Quick Checklist

- [ ] Mobile-first, tested at 360px and 320px
- [ ] Archivo for display and labels, Noto Sans for text, Noto Serif only for documents
- [ ] Semantic tokens only; dark theme works
- [ ] One clay primary button per view; ochre is never text on light
- [ ] Thread band on top of the page; wordmark on its weave band
- [ ] Graphic language = only the four weave devices (band, mosaic, chevron field, colour blocks); tiles in fixed order
- [ ] Max two weave bands, one mosaic and one chevron field per screen; the only gradient is the primary button
- [ ] 14px root; controls 12px radius, cards 16px radius; hairline border plus soft Earth-tinted shadow
- [ ] Page built from `components/shared` furniture; loading, error and empty states handled per card
- [ ] 44px touch targets on coarse pointers, visible focus rings, WCAG AA contrast
- [ ] Status = colour + icon + words
- [ ] Every confirmation has a reference, a date and a next step
- [ ] Strings in i18n files; money and dates via `Intl`; RTL-safe logical properties
- [ ] JS shell under 170 KB gz; lazy images; Low-data mode respected
- [ ] Motion 150 to 600ms, no bounce, reduced-motion respected
- [ ] No emoji, exclamation marks, em dashes or hype words
- [ ] Placeholders in brackets, never invented facts

---

**Remember:** Motherland should feel like an institution you can trust and a home you recognise. When in doubt: plainer words, more Earth and Ivory, one strong block of Clay, and the weave in its place.
