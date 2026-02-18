# B0: Design System & Tokens — Hyrox AI Coach

> **Visual Identity:** Raw Industrial Meets Precision Coaching
> **Aesthetic DNA:** The grit of a warehouse gym crossed with the precision of a performance lab.
> **Default Theme:** Dark mode
> **Primary Accent:** Hyrox Yellow (#FFD700)

This document is the single source of truth for all visual design decisions. Every component, screen, and animation in the app references this spec. It must be implemented first (B0) before any screen is built.

---

## 1. Visual Identity & Tone

### 1.1 The Two Pillars

| Pillar | Real-World Reference | Digital Translation |
|--------|---------------------|---------------------|
| **Raw Industrial** | Warehouse gyms, Hyrox venue halls (ExCeL London, McCormick Place), exposed steel, concrete floors, stencil-painted markings | Dark matte surfaces, subtle grain textures, ALL CAPS condensed headings, sharp 90-degree corners, thin 1px structural borders, caution-stripe yellow accents |
| **Precision Coaching** | Sports science labs, heart-rate displays, VO2max readouts, race timing systems, fighter jet HUDs | Monospace numerics for data, clean progress rings, tight grid alignment, 4px base spacing, mathematical typographic scale, animated counters |

### 1.2 Balance Rule

- **Motivational screens** (dashboard, achievements, race countdown) lean **60% industrial / 40% precision**
- **Data screens** (analytics, race splits, PR board) lean **30% industrial / 70% precision**
- **Functional screens** (chat, workout logger, settings) lean **40% industrial / 60% precision**

### 1.3 Reference Apps

| App | What to Learn |
|-----|---------------|
| **WHOOP** | Circular strain gauge as signature element, data-first monospace numbers, dark-on-dark elevation |
| **Nike Training Club** | Condensed bold type + minimal color = powerful athletic identity |
| **Linear** | Dark mode with extreme precision, keyboard-first feel, subtle gradients |
| **Strava** | Data-dense screens made inviting through spacing and hierarchy |
| **Arc Browser** | Subtle noise/grain on dark backgrounds, premium without flashy |

---

## 2. Color System

### 2.1 Surface Elevation (Dark Mode)

```css
@theme {
  /* Surface system — lighter = higher elevation */
  --color-surface-0: #0A0A0B;    /* App shell / deepest background */
  --color-surface-1: #111113;    /* Primary content background */
  --color-surface-2: #18181B;    /* Cards, elevated containers */
  --color-surface-3: #1F1F23;    /* Hover states, active surfaces */
  --color-surface-4: #27272B;    /* Modal backgrounds, popovers */
  --color-surface-5: #2E2E33;    /* Highest elevation — tooltips */
}
```

### 2.2 Accent Colors

```css
@theme {
  /* Hyrox Yellow — "the high-voltage warning label" */
  --color-accent: #FFD700;
  --color-accent-hover: #FFE033;
  --color-accent-muted: #FFD70033;   /* 20% — glows, backgrounds */
  --color-accent-subtle: #FFD70015;  /* 8% — very subtle tints */

  /* Coach K Blue — AI responses, informational */
  --color-coach-blue: #3B82F6;
  --color-coach-green: #10B981;      /* Positive actions */
}
```

### 2.3 Text Hierarchy

```css
@theme {
  --color-text-primary: #F4F4F5;     /* zinc-100 */
  --color-text-secondary: #A1A1AA;   /* zinc-400 */
  --color-text-tertiary: #71717A;    /* zinc-500 */
  --color-text-inverse: #0A0A0B;     /* On yellow backgrounds */
}
```

### 2.4 Semantic Colors

```css
@theme {
  --color-success: #22C55E;   /* PRs, completions, recovery */
  --color-warning: #EAB308;   /* Approaching limits, caution */
  --color-danger: #EF4444;    /* Errors, max strain, overtraining */
  --color-info: #3B82F6;      /* Informational, AI responses */
}
```

### 2.5 Performance Indicator Colors

```css
@theme {
  --color-perf-excellent: #22C55E;  /* Above benchmark */
  --color-perf-good: #84CC16;       /* Slightly above */
  --color-perf-average: #EAB308;    /* At benchmark */
  --color-perf-below: #F97316;      /* Slightly below */
  --color-perf-poor: #EF4444;       /* Significantly below */
}
```

### 2.6 Station Colors (for charts and station identification)

```css
@theme {
  --color-station-ski: #3B82F6;      /* Blue */
  --color-station-push: #EF4444;     /* Red */
  --color-station-pull: #F97316;     /* Orange */
  --color-station-burpee: #8B5CF6;   /* Purple */
  --color-station-row: #06B6D4;      /* Cyan */
  --color-station-carry: #22C55E;    /* Green */
  --color-station-lunge: #EC4899;    /* Pink */
  --color-station-wall: #EAB308;     /* Yellow */
}
```

### 2.7 Border Colors

```css
@theme {
  --color-border-default: #27272A;   /* zinc-800 — subtle structural */
  --color-border-hover: #3F3F46;     /* zinc-700 — hover state */
  --color-border-accent: #FFD70040;  /* Yellow 25% — accent borders */
}
```

### 2.8 Yellow Accent Usage Rules

| Usage | Treatment | Max Per Screen |
|-------|-----------|---------------|
| Primary CTA | Solid #FFD700 fill, black text | 1 |
| Active timer / Live indicator | Pulsing glow, solid fill | 1 |
| Progress rings / Gauges | #FFD700 stroke | 2-3 |
| Accent borders | Left/top 3px solid | 2-4 |
| Data highlights | Text color for key metrics | 3-5 |
| Hover/Active states | Border glow, background tint | On interaction only |
| **Never** | Large background fills, full-width bars, body text | -- |

**Contrast:** #FFD700 on #0A0A0B = 13.5:1 (exceeds WCAG AAA)

---

## 3. Typography

### 3.1 Font Stack — "The Competition Board" (Selected Pairing)

| Role | Font | Weights | Heritage |
|------|------|---------|----------|
| **Display** | **Barlow Condensed** | Bold (700), ExtraBold (800), Black (900) | California freeway signage — inherently industrial, built for wayfinding at speed. UC Berkeley's athletic condensed font. |
| **Body** | **IBM Plex Sans** | Regular (400), Medium (500), SemiBold (600) | IBM engineering pedigree — instrument panel clarity, mainframe precision. Superior l/I/1 distinction for data-heavy UIs. |
| **Data/Mono** | **JetBrains Mono** | Regular (400), Bold (700) | Developer-grade clarity, tabular numerics, digital readout aesthetic. |

### 3.2 Tailwind CSS v4 Configuration

```css
@theme {
  --font-display: 'Barlow Condensed', 'Arial Narrow', sans-serif;
  --font-body: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### 3.3 Next.js Font Loading

```typescript
import { Barlow_Condensed, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
});

// Layout: <body className={`${barlowCondensed.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} font-body antialiased`}>
```

### 3.4 Typographic Scale (Major Third 1.250)

```css
@theme {
  --text-xs: 0.64rem;     /* 10.24px — fine print, labels */
  --text-sm: 0.8rem;      /* 12.8px — captions, secondary text */
  --text-base: 1rem;      /* 16px — body text */
  --text-lg: 1.25rem;     /* 20px — large body, card titles */
  --text-xl: 1.563rem;    /* 25px — section headings */
  --text-2xl: 1.953rem;   /* 31.25px — page headings */
  --text-3xl: 2.441rem;   /* 39px — hero headings */
  --text-4xl: 3.052rem;   /* 48.8px — display text */
  --text-5xl: 3.815rem;   /* 61px — massive display */
  --text-timer: 4.5rem;   /* 72px — main timer display */
  --text-stat: 2.5rem;    /* 40px — stat counters */
}
```

### 3.5 Typography Usage Rules

| Context | Font | Style | Example |
|---------|------|-------|---------|
| Page headings | `font-display` | ALL CAPS, tracking-wider, font-extrabold, line-height 0.95 | `DASHBOARD`, `RACE HUB` |
| Section headings | `font-display` | ALL CAPS, tracking-wide, font-bold | `SLED PUSH`, `WEEK 12` |
| Body text | `font-body` | Normal case, font-normal, line-height 1.6 | Coach responses, descriptions |
| Labels/captions | `font-body` | Normal case, text-sm, text-secondary | Form labels, metadata |
| Timer displays | `font-mono` | tabular-nums, font-bold, tracking-tight | `01:23:45` |
| Stat numbers | `font-mono` | tabular-nums, text-stat | `42.3`, `185` |
| Equipment labels | `font-display` | ALL CAPS, text-xs, tracking-[0.2em], border | `VO2 MAX EST.` |

---

## 4. Spacing, Layout & Borders

### 4.1 Base Grid

- **Spacing unit**: 4px (Tailwind default)
- **Content max-width**: `max-w-2xl` (672px) for forms, `max-w-7xl` (1280px) for dashboard
- **Card gap**: `gap-3` (12px) mobile, `gap-4` (16px) desktop
- **Section spacing**: `space-y-6` (24px) between major sections
- **Card padding**: `p-4` (16px) mobile, `p-6` (24px) desktop

### 4.2 Border Radii

```css
@theme {
  --radius-sm: 2px;    /* Cards, containers — sharp, industrial */
  --radius-md: 4px;    /* Buttons, inputs — minimal rounding */
  --radius-lg: 6px;    /* Modals, drawers — slightly softer */
  --radius-full: 9999px; /* Pills, badges, avatars only */
}
```

**Philosophy**: Sharp, 90-degree-adjacent corners. NOT rounded/bubbly. `rounded-sm` (2px) is the default — just enough to not look broken. Full rounding only for pills and avatars.

### 4.3 Border Treatments

```html
<!-- Default card: thin structural border -->
<div class="border border-zinc-800 rounded-sm">

<!-- Active/selected: yellow accent glow -->
<div class="border border-[#FFD70066] shadow-[0_0_12px_rgba(255,215,0,0.08)] rounded-sm">

<!-- Left accent: station info, AI insight -->
<div class="border border-zinc-800 border-l-[3px] border-l-[#FFD700] rounded-sm">

<!-- Top accent: caution stripe feel -->
<div class="border border-zinc-800 border-t-2 border-t-[#FFD700] rounded-sm">
```

### 4.4 Responsive Breakpoints

| Breakpoint | Layout | Navigation |
|-----------|--------|------------|
| Mobile (< 768px) | Single column, full-width cards | Bottom tab bar |
| Tablet (768-1024px) | 2-column grid, centered forms | Bottom tab bar or sidebar |
| Desktop (> 1024px) | Multi-column, sidebar + content | Collapsible sidebar (~280px) |

---

## 5. Shadow System

```css
@theme {
  /* Elevation shadows (dark mode optimized) */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
  --shadow-xl: 0 16px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08);

  /* Accent glows */
  --shadow-glow-sm: 0 0 10px rgba(255, 215, 0, 0.15);
  --shadow-glow-md: 0 0 20px rgba(255, 215, 0, 0.2);
  --shadow-glow-lg: 0 0 40px rgba(255, 215, 0, 0.25), 0 0 10px rgba(255, 215, 0, 0.4);

  /* Inset shadows (pressed states) */
  --inset-shadow-sm: inset 0 1px 3px rgba(0, 0, 0, 0.4);
  --inset-shadow-md: inset 0 2px 6px rgba(0, 0, 0, 0.5);
}
```

**Usage:**
- Cards at rest: `shadow-sm` + `surface-2`
- Cards on hover: `shadow-md` + `surface-3` + optional accent border glow
- Primary CTA: `shadow-glow-md` for ambient yellow glow
- Active timer: `shadow-glow-lg` as "live/active" indicator
- Pressed states: `inset-shadow-sm` for physical depression feel

---

## 6. Atmosphere & Texture

### 6.1 Grain/Noise Overlay (CSS-Only)

```css
/* Tailwind v4 utility */
@utility grain {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.03;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }
}
```

Apply `grain` to: app shell background, hero sections, achievement banners. **Not** to cards or interactive elements.

### 6.2 Background Gradients

```css
/* Hero/Dashboard: subtle gold radial glow from top */
.bg-hero-gradient {
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 215, 0, 0.06) 0%, transparent 70%),
    radial-gradient(ellipse 60% 60% at 80% 100%, rgba(255, 215, 0, 0.03) 0%, transparent 50%),
    var(--color-surface-0);
}

/* Card: subtle top-edge light */
.bg-card-gradient {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
    var(--color-surface-2);
}
```

### 6.3 Structural Grid (Visible Engineering Grid)

```html
<!-- Exposed grid lines in dashboard backgrounds -->
<div class="bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]">
```

### 6.4 Glassmorphism Rules

- **Use glass:** Floating nav bars, modal backdrops, sticky headers during scroll
- **Avoid glass:** Cards at rest, data displays, more than 2 simultaneous on mobile
- **Implementation:** `bg-[#0A0A0B]/80 backdrop-blur-md border-b border-zinc-800/50`

### 6.5 Industrial Decorative Elements

**Caution Stripe:**
```css
.caution-stripe {
  background: repeating-linear-gradient(-45deg, #FFD700, #FFD700 10px, #0A0A0B 10px, #0A0A0B 20px);
  height: 4px;
  opacity: 0.6;
}
```

**Station Number Watermarks:**
```html
<!-- Oversized stencil numbers behind content -->
<div class="font-display text-[120px] font-black text-zinc-800/30 absolute -top-8 -right-4 select-none leading-none tracking-tight uppercase">
  04
</div>
```

**Equipment Label Pattern:**
```html
<span class="font-display text-[10px] uppercase tracking-[0.2em] text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-sm bg-zinc-900">
  VO2 MAX EST.
</span>
```

**Stamped/Stenciled Classification:**
```html
<div class="absolute top-4 right-4 -rotate-12 border-2 border-[#FFD700]/20 rounded-sm px-3 py-1 font-display text-xs uppercase tracking-widest text-[#FFD700]/20 font-bold">
  ELITE
</div>
```

---

## 7. Animation Strategy

### 7.1 Motion Principles

| Principle | Description | Anti-Pattern |
|-----------|-------------|-------------|
| **Weighted & purposeful** | Elements have mass — hydraulic press, not butterfly | Floaty, wispy movements |
| **Sharp & decisive** | Short durations, confident easing | Long, lazy transitions |
| **Sequential precision** | Staggered reveals like stations activating | Everything appearing at once |
| **Mechanical rhythm** | Consistent timing like a metronome | Random chaotic timing |
| **Restrained celebration** | Controlled precision confetti | Over-the-top bouncing |

### 7.2 Easing Curves

```typescript
// "Industrial Snap" — Primary easing for most UI transitions
// Fast-in, sharp deceleration: hydraulic mechanism snapping into place
const INDUSTRIAL_SNAP = [0.16, 1, 0.3, 1] as const;

// "Precision Ease" — Data reveals and chart animations
// Smooth and measured, precision instrument settling
const PRECISION_EASE = [0.33, 1, 0.68, 1] as const;

// "Machine Press" — Heavy/impactful (modal reveals, drawer opens)
// Accelerates aggressively, locks into position
const MACHINE_PRESS = [0.22, 0.68, 0, 1] as const;
```

### 7.3 Spring Configurations

```typescript
// Micro-interactions (buttons, toggles, small reveals)
const SPRING_TIGHT = { stiffness: 400, damping: 30, mass: 0.8 };

// Progress rings, gauges, counter animations
const SPRING_GAUGE = { stiffness: 120, damping: 20, mass: 1 };

// Page transitions, large modal reveals
const SPRING_HEAVY = { stiffness: 200, damping: 28, mass: 1.2 };

// Toggles, checkbox states, small state changes
const SPRING_SNAP = { stiffness: 500, damping: 35, mass: 0.5 };
```

### 7.4 Page Load Orchestration

- **Stagger interval**: 60ms per child element
- **Initial delay**: 100ms
- **Item animation**: opacity 0 -> 1, y 12 -> 0, blur 4px -> 0
- **Duration**: 400ms per item with INDUSTRIAL_SNAP easing
- **Direction**: Header slides down from top, content cards fade up, side panels slide from edge, modals scale from center
- **Data values**: No movement, just opacity + blur clear

### 7.5 Scroll Animations

- **Cards/sections**: whileInView with `{ once: true, margin: "-80px" }`, 500ms INDUSTRIAL_SNAP
- **Progress bars**: useScroll + useSpring (stiffness: 100, damping: 30)
- **Animate on scroll**: Stat cards, achievement badges, charts, section headings
- **Keep static**: Navigation, active timers, critical data, forms during use

### 7.6 Micro-Interactions

| Element | Hover | Press/Active |
|---------|-------|------------|
| **Buttons** | scale 1.02, 150ms ease-out | scale 0.97, 100ms ease-in, inset shadow |
| **Cards** | surface-3 background, hint of gold border, 200ms | -- |
| **Toggles** | -- | SPRING_SNAP (stiffness 500, damping 35), rounded-sm |
| **Tabs** | -- | layoutId underline indicator, SPRING_TIGHT |
| **Primary CTA** | shadow-glow-md yellow glow | inset-shadow-sm depression |

### 7.7 Data Visualization Animation

| Type | Duration | Easing | Notes |
|------|----------|--------|-------|
| Progress rings | 1.2s | PRECISION_EASE | strokeLinecap: butt (sharp, not rounded) |
| Counter numbers | 1.5s | PRECISION_EASE | @number-flow/react for animated values |
| Bar charts | 600ms + 40ms stagger | INDUSTRIAL_SNAP | Scale from bottom (originY: 1) |
| Radar charts | 1s | PRECISION_EASE | Draw path from center outward |
| Data tables | 30ms row stagger | INDUSTRIAL_SNAP | Populate row-by-row |

### 7.8 AI Chat Streaming

- **Words** fade in with y:4, blur:2px -> 0, 250ms, 30ms stagger per word
- **Cursor**: Pulsing yellow block (not blinking pipe) — terminal/instrument aesthetic
- **Markdown sections**: Slight 200ms delay between paragraphs for readability

### 7.9 Celebration/Achievement

- **PR detection**: Background flash gold (0.6s), scale-pop badge (0.4s), 12-16 gold particles upward (0.8s)
- **Canvas-confetti settings**: particleCount: 20, spread: 45, colors: ['#FFD700', '#FFC000', '#FFFFFF'], gravity: 1.2, ticks: 100
- **Philosophy**: Controlled, not chaotic. Precision confetti.

### 7.10 Page Transitions

- **Enter**: clipPath inset from right, 350ms MACHINE_PRESS
- **Exit**: clipPath out to left, 250ms INDUSTRIAL_SNAP
- **Drawers**: spring (stiffness: 300, damping: 30) — no bounce
- **Modals**: scale 0.95 -> 1 with opacity, backdrop blur-sm

### 7.11 Performance Budget

| Constraint | Value |
|-----------|-------|
| Max simultaneous animations | 8-10 mobile, 15-20 desktop |
| GPU-only properties | `transform` and `opacity` for scroll-linked |
| Max stagger children | 12-15 before switching to group animation |
| Stagger interval range | 40-80ms per item |
| Total sequence duration | < 1.5s for any load sequence |
| Backdrop-blur limit | Max 2 simultaneous on mobile |
| will-change | Apply only during animation, remove after |
| **Reduced motion** | Always respect `prefers-reduced-motion` — replace with instant or opacity-only |

---

## 8. Iconography

### 8.1 Library: Lucide React

- **Why**: Native to shadcn/ui, consistent stroke style, comprehensive icon set
- **Style**: 1.5px stroke weight, 24px default, rounded line caps
- **Install**: `lucide-react` (already in project dependencies)

### 8.2 Icon Usage Rules

| Context | Size | Color |
|---------|------|-------|
| Navigation tabs | 20px (`h-5 w-5`) | Active: `text-accent`, Inactive: `text-zinc-500` |
| Card icons | 16px (`h-4 w-4`) | `text-zinc-400` |
| Button icons | 16px (`h-4 w-4`) | Inherits button text color |
| Station icons | 24px (`h-6 w-6`) | Station color from palette |
| Hero/empty state | 48px (`h-12 w-12`) | `text-zinc-600` |

### 8.3 Station Icon Mapping

| Station | Lucide Icon | Fallback |
|---------|-------------|----------|
| Ski Erg | `Waves` | `Activity` |
| Sled Push | `ArrowRight` | `MoveRight` |
| Sled Pull | `ArrowLeft` | `MoveLeft` |
| Burpee Broad Jump | `Zap` | `ChevronUp` |
| Rowing | `Ship` | `Activity` |
| Farmers Carry | `Dumbbell` | `GripHorizontal` |
| Sandbag Lunges | `Footprints` | `ArrowDown` |
| Wall Balls | `Target` | `Circle` |
| Running | `Timer` | `Clock` |

---

## 9. Signature UI Element: "The Station Rail"

The app's visual fingerprint — an 8-segment progress indicator representing Hyrox's 8 run+station blocks.

```
RUN → [SKI ERG] → RUN → [SLED PUSH] → RUN → [SLED PULL] → RUN → [BURPEES] →
▓▓▓    ████████    ▓▓▓    ██████████    ▓▓▓    █████████    ▓▓▓    ████████

RUN → [ROWING] → RUN → [FARMERS] → RUN → [LUNGES] → RUN → [WALL BALLS]
▓▓▓    ████████   ▓▓▓    ████████    ▓▓▓    ████████   ▓▓▓    ██████████
```

- **8 station segments** separated by 2px gaps
- **Run portions**: narrower, darker (zinc-700)
- **Active station**: #FFD700 with pulse glow
- **Completed stations**: station color at 50% opacity
- **Upcoming stations**: surface-2 (dark)
- **Appears on**: Dashboard header, workout views, active workout progress

---

## 10. Component Architecture

### 10.1 Three-Layer Model

| Layer | Source | Purpose |
|-------|--------|---------|
| **Layer 1** | shadcn/ui (Radix primitives) | Button, Input, Select, Dialog, Sheet, Tabs, Progress, Switch, Slider, Checkbox, Radio Group, Label, Separator, Scroll Area, Tooltip, Popover, Command, Drawer, Dropdown Menu, Textarea, Toast (sonner) — 21 components installed |
| **Layer 2** | Custom B0 components | Built from scratch using B0 design tokens + shadcn primitives + Lucide icons. These define the app experience: chat, workout execution, dashboard analytics, training calendar, benchmark tracking |
| **Layer 3** | Supplementary libraries | Recharts (charts), TanStack Table (data tables), sonner (toasts), canvas-confetti (celebrations), @dnd-kit (drag-and-drop) |

### 10.2 Custom Components to Build (12)

1. Chat message list + message bubbles
2. Streaming text renderer (with word-level animation)
3. Timer / Countdown / Stopwatch
4. Multi-step wizard / Stepper progress
5. Stat / Metric cards (animated counters)
6. Progress ring (SVG circular gauge)
7. Multi-select / Chip selector
8. Checklist component
9. RPE Slider with labeled descriptions
10. Station Rail (signature element)
11. Split visualization (stacked bar charts)
12. Comparison UI (side-by-side race data)

---

## 11. Tech Stack (Confirmed)

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router, RSC) |
| **UI** | React 19, TypeScript 5.9+ (strict) |
| **Styling** | Tailwind CSS v4 (Oxide engine) |
| **Animation** | Motion v12+ (Framer Motion successor) |
| **Components** | shadcn/ui + custom B0 components |
| **Charts** | Recharts |
| **Tables** | TanStack Table v5 |
| **State** | TanStack Query v5 (server), Zustand (UI) |
| **Validation** | Zod |
| **Icons** | Lucide React |
| **Auth** | Supabase Auth |
| **Database** | Supabase PostgreSQL + PGVector |
| **AI Inference** | Nebius Token Factory (Llama 3.3 70B LoRA) |
| **Embeddings** | OpenAI text-embedding-3-small |
| **Deployment** | Vercel |
| **Package Manager** | Bun |
| **Linting** | Biome |

---

## 12. Design Checklist (Pre-Build Validation)

- [x] Visual identity defined ("Raw Industrial Meets Precision Coaching")
- [x] Color palette with CSS variables (surfaces, accents, semantic, stations, borders)
- [x] Typography: 3 distinctive fonts with rationale (Barlow Condensed / IBM Plex Sans / JetBrains Mono)
- [x] Typographic scale (Major Third 1.250)
- [x] Typography usage rules by context
- [x] Spacing system (4px grid, responsive breakpoints)
- [x] Border radii (sharp industrial — 2px default)
- [x] Border treatment patterns
- [x] Shadow system (dark mode optimized elevation + accent glows)
- [x] Grain/noise texture implementation (CSS-only, performant)
- [x] Background gradient specifications
- [x] Glassmorphism usage rules
- [x] Industrial decorative elements (caution stripes, watermarks, labels)
- [x] Animation easing curves (3 custom beziers + 4 spring configs)
- [x] Page load orchestration spec
- [x] Scroll animation rules
- [x] Micro-interaction patterns
- [x] Data visualization animation timing
- [x] AI streaming text animation
- [x] Celebration/achievement animation
- [x] Page transition specs
- [x] Performance budget (mobile limits, reduced motion)
- [x] Icon library (Lucide React) with station mapping
- [x] Signature element ("The Station Rail")
- [x] Component architecture (3-layer model)
- [x] 12 custom components identified
- [x] Full tech stack confirmed
- [x] Yellow accent usage rules (scarcity = impact)

---

*Sources: Perplexity deep research (design_system_research_20260216), Phase 1-6 research outputs, WHOOP/Nike/Linear/Strava UI analysis, Parker Henderson dark mode shadows research, Google Fonts analysis*
