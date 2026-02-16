# Research Output: custom_research
## Generated: 2026-02-16T15:20:36.259713
## Preset: advanced-deep-research
## Model: anthropic/claude-opus-4-6
## Cost: $2.3781
## Research steps: 7 searches, 3 URL fetches
## Output length: 50945 chars, 6748 words

---

Now I have gathered comprehensive research material. Let me compile everything into the final document.

---

# Design System Research: "Raw Industrial Meets Precision Coaching"
## Hyrox AI Coach App — Comprehensive Design Specification

**Date:** February 16, 2026  
**Stack:** Next.js 16, React 19, Tailwind CSS v4, Kokonut UI, shadcn/ui, Motion (v2.11+)

---

## Table of Contents
1. [Visual Identity & Tone References](#1-visual-identity--tone-references)
2. [Typography System](#2-typography-system)
3. [Comprehensive Animation Strategy](#3-comprehensive-animation-strategy)
4. [Atmosphere & Texture Specification](#4-atmosphere--texture-specification)
5. [Differentiation: Signature UI Identity](#5-differentiation-signature-ui-identity)

---

## 1. Visual Identity & Tone References

### 1.1 The Two Pillars Defined

Understanding the aesthetic requires separating and then deliberately fusing two design vocabularies:

#### "Raw Industrial" Design DNA
| Element | Real-World Reference | Digital Translation |
|---------|---------------------|-------------------|
| Exposed steel & concrete | Warehouse gyms, CrossFit boxes, Hyrox venue halls (exhibition centers with raw concrete, rigging, exposed ductwork) | Dark matte surfaces (#0A0A0A–#1A1A1A), subtle grain texture overlays, low-saturation UI |
| Stencil typography | Equipment labels, military crates, gym floor markings | All-caps condensed headings, letter-spacing tracking, monospaced numerics |
| Caution/hazard markings | Yellow-black diagonal striping on equipment, safety tape, loading zone markings | Accent color usage pattern — #FFD700 as "warning" highlight, diagonal stripe decorative elements |
| Exposed grid/structure | Steel I-beams, chain-link, welded frames | Visible grid lines, sharp 90° corners on cards, thin 1px borders, exposed layout structure |
| Raw material finishes | Brushed steel, matte rubber, chalk dust | Subtle noise/grain overlay, matte (not glossy) surfaces, minimal shine |

#### "Precision Coaching" Design DNA
| Element | Real-World Reference | Digital Translation |
|---------|---------------------|-------------------|
| Lab instrumentation | Sports science labs, heart-rate displays, VO2max readouts | Monospace numerics for timers/stats, clean data visualization, precise alignment |
| Performance dashboards | WHOOP strain gauge, Garmin dashboards, race telemetry | Progress rings, stat cards with decimal precision, animated counters |
| Clinical precision | White-coat lab environments, calibration equipment | Tight grid alignment, mathematical spacing (4px base), consistent typographic scale |
| Data-dense displays | Race control rooms, timing systems, split boards at events | Information-dense layouts that don't feel cluttered, careful hierarchy |
| Optic-grade displays | Fighter jet HUDs, automotive gauge clusters | Monospace fonts for data, accent-colored data points, subtle glow on active metrics |

### 1.2 Reference Apps & How They Balance the Spectrum

**WHOOP (Primarily Precision, Touch of Raw)**
- Deep black background (#000000) with elevation via subtle surface lightening
- Strain gauge as signature element — a circular progress ring that fills from green → yellow → red
- Data-first philosophy: large monospace numbers, small labels
- Animation: smooth counter animations, circular gauge fills on load
- *Lesson:* Their circular strain gauge is instantly recognizable. Our app needs an equivalent signature element.

**Nike Training Club / Nike Run Club (Balanced)**
- Trade Gothic Bold Condensed for headers — the quintessential athletic stencil feel
- Minimal color palette: black + white + one accent per context
- Full-bleed imagery with text overlay — cinematic feeling
- Clean iconography, functional and waypoint-oriented
- *Lesson:* NTC proves condensed bold type + minimal color = powerful athletic identity.

**Freeletics (More Raw)**
- Dark backgrounds, aggressive typography, high-energy feel
- Workout cards with sharp edges, bold numbering
- Less data visualization, more motivational/action-oriented
- *Lesson:* Raw energy works for motivation screens, but needs precision balance for training data.

**Strava (Primarily Precision)**
- Clean white/dark UI with segment data, charts, route maps
- Detailed split tables, elevation profiles, performance analytics
- Orange accent for premium/active states
- *Lesson:* Shows how to make data-dense screens feel inviting through spacing and hierarchy.

**PUSH Band / Velocity-Based Training Apps (Deep Precision)**
- Minimal UI focused on real-time data: velocity, power, force curves
- Dark backgrounds with neon accent colors on live data
- Scientific visualization aesthetic
- *Lesson:* The "instrument panel" feeling where every pixel serves a data purpose.

### 1.3 Hyrox Event Venue Aesthetic

From researching Hyrox events (held in exhibition halls like ExCeL London, Oval Lingotto Turin, McCormick Place Chicago):
- **Massive indoor spaces** with industrial infrastructure — exposed ceiling rigging, concrete floors
- **Hyrox brand colors**: Black, white, and a bold yellow-gold accent
- **Event signage**: Large stencil-style station numbers, LED timing boards, clear wayfinding
- **Atmosphere**: Fog machines, dramatic lighting, loud music — a concert-meets-competition energy
- **Race format visualization**: The 8-station sequential format (alternating run + station) is the core identity — always represented as a linear sequence or circuit

---

## 2. Typography System

### 2.1 Requirements Matrix

| Role | Character | Technical Needs |
|------|-----------|----------------|
| **Display/Heading** | Raw, industrial, commanding — stencil/gym wall energy | All-caps support, condensed widths, heavy weights, Google Fonts |
| **Body** | Precise, technical, highly legible — instrument panel clarity | Good x-height, clear l/I/1 distinction, multiple weights, Google Fonts |
| **Monospace/Data** | Digital readout, timer display, lab instrument | Tabular numerals, clear at small sizes, Google Fonts |

### 2.2 Font Analysis

#### Display Font Candidates (Ranked)

**1. Barlow Condensed (Bold/ExtraBold/Black)**
- **Why it fits:** Designed by Jeremy Tribby as a grotesk inspired by California's freeway signage — inherently industrial and built for wayfinding at speed. The condensed width packs power into tight spaces. In Black weight, it feels like stenciled equipment labels. UC Berkeley uses it as their athletic condensed font for exactly this reason.
- **Condensed width:** Allows long station names ("BURPEE BROAD JUMP") to fit on one line
- **Weight range:** Thin to Black (9 weights + italics) — enormous flexibility
- **Google Fonts:** ✅ Free, open source
- **Verdict:** ★★★★★ — Top recommendation. The freeway/industrial signage heritage is perfect.

**2. Bebas Neue**
- **Why it fits:** The internet's most-used display condensed — essentially the digital version of the Impact family, but better proportioned. Ultra-condensed, all-caps by design. Feels like gym wall typography, race bibs, and competition signage.
- **Limitation:** Only one weight (Regular) on Google Fonts — no bold/light variations
- **Google Fonts:** ✅ 
- **Verdict:** ★★★★☆ — Stunning but inflexible. Works if only used at very large sizes.

**3. Teko**
- **Why it fits:** A Devanagari + Latin family with a distinctly engineered, squared character. The geometric construction gives it a technical precision that matches military/industrial contexts. Slightly wider than Bebas Neue.
- **Weight range:** Light to Bold (5 weights)
- **Google Fonts:** ✅
- **Verdict:** ★★★★☆ — Great geometric-industrial option with good weight range.

**4. Chakra Petch**
- **Why it fits:** Categorized as "Modern/Techno" — a square sans-serif with subtly tapered/clipped corners that evoke digital displays, circuit boards, and technical instrumentation. Bridges the gap between raw industrial and futuristic precision.
- **Weight range:** Light to Bold (6 weights + italics)
- **Google Fonts:** ✅
- **Verdict:** ★★★★☆ — The tapered corners add a unique "precision tech" character. Excellent for secondary headings and station labels.

**5. Rajdhani**
- **Why it fits:** Geometric, angular letterforms with a distinct squared quality. Feels like instrument panel labeling or engineering diagram annotations.
- **Weight range:** Light to Bold (5 weights)
- **Google Fonts:** ✅
- **Verdict:** ★★★☆☆ — Good secondary option, slightly less commanding than Barlow Condensed.

**Other reviewed:** Oswald (good but overused), Anton (too heavy, one weight), Saira/Saira Condensed (interesting semi-condensed with a motorsport feel), Orbitron (too sci-fi/futuristic for industrial aesthetic).

#### Body Font Candidates (Ranked)

**1. IBM Plex Sans**
- **Why it fits:** Designed by IBM for user interfaces — the name alone signals "precision engineering." Inspired by American gothics (Franklin Gothic, Trade Gothic) but refined for screen clarity. Has a seriffed uppercase I and tailed lowercase l — critical for data-heavy UIs where l/I/1 confusion kills trust.
- **The IBM heritage** evokes mainframes, instrument panels, and technical documentation — perfect for "precision coaching" DNA
- **Weight range:** Thin to Bold (7 weights + italics + condensed)
- **Google Fonts:** ✅
- **Verdict:** ★★★★★ — Top recommendation. The engineering pedigree is unmatched.

**2. DM Sans**
- **Why it fits:** A geometric sans-serif with generous optical sizing. Clean, modern, and highly legible. Less "engineering" character than IBM Plex but more neutral/universal.
- **Weight range:** Variable (100–1000)
- **Google Fonts:** ✅
- **Verdict:** ★★★★☆ — Excellent fallback. Very clean but perhaps too "friendly" for industrial aesthetic.

**3. Titillium Web**
- **Why it fits:** Born from an academic project at Accademia di Belle Arti di Urbino — has a distinctly European technical/engineering feel. Used in motorsport contexts and technical documentation.
- **Weight range:** ExtraLight to Black (9 weights + italics)
- **Google Fonts:** ✅
- **Verdict:** ★★★★☆ — Strong runner-up with authentic technical DNA.

**4. Exo 2**
- **Why it fits:** A geometric sans-serif designed for screen clarity with a slightly futuristic quality. Clean and precise without being cold.
- **Google Fonts:** ✅
- **Verdict:** ★★★☆☆ — Good but lacks the distinctive engineering character of IBM Plex.

#### Monospace/Data Font Candidates

**1. JetBrains Mono (already selected)**
- **Why it fits:** Designed for developers — supreme clarity at small sizes, ligature support, distinct character shapes. The "code readout" feeling is perfect for performance data.
- **Tabular numerals:** ✅ All characters same width — critical for timer displays
- **Google Fonts:** ✅
- **Verdict:** ★★★★★ — Confirmed. Keep this selection.

**2. Space Mono**
- **Why it fits:** Has more personality/character than JetBrains Mono — slightly quirky letterforms evoke vintage computer terminals and old instrument readouts.
- **Google Fonts:** ✅ (but only Regular + Bold)
- **Verdict:** ★★★★☆ — Could work for large timer displays where character > clarity.

**3. IBM Plex Mono**
- **Why it fits:** Pairs perfectly with IBM Plex Sans body — consistent design language. Same engineering heritage.
- **Google Fonts:** ✅
- **Verdict:** ★★★★☆ — Best choice if using IBM Plex Sans as body font for family cohesion.

### 2.3 Recommended Pairings

#### Pairing A: "The Competition Board" (Primary Recommendation)

| Role | Font | Weight(s) | Why |
|------|------|-----------|-----|
| **Display** | **Barlow Condensed** | Bold (700), ExtraBold (800), Black (900) | Freeway signage industrial DNA, military precision, wide weight range for hierarchy |
| **Body** | **IBM Plex Sans** | Regular (400), Medium (500), SemiBold (600) | Engineering instrument panel clarity, IBM technical heritage, superior l/I/1 distinction |
| **Data/Mono** | **JetBrains Mono** | Regular (400), Bold (700) | Developer-grade clarity, tabular numerics, digital readout aesthetic |

**Rationale:** This pairing creates a clear spectrum from raw (Barlow Condensed screaming in ALL CAPS at the top) through measured precision (IBM Plex Sans in body copy) to digital instrument (JetBrains Mono for data). Each font has a strong functional identity and they never compete visually.

```css
/* Tailwind CSS v4 — @theme configuration */
@theme {
  --font-display: 'Barlow Condensed', 'Arial Narrow', sans-serif;
  --font-body: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

#### Pairing B: "The Tech Lab"

| Role | Font | Weight(s) | Why |
|------|------|-----------|-----|
| **Display** | **Chakra Petch** | SemiBold (600), Bold (700) | Techno-square with tapered corners — bridges industrial and precision futurism |
| **Body** | **IBM Plex Sans** | Regular (400), Medium (500) | Same rationale as above |
| **Data/Mono** | **IBM Plex Mono** | Regular (400), Bold (700) | Family cohesion with IBM Plex Sans body |

**Rationale:** More cohesive and tech-forward. Chakra Petch's clipped corners suggest circuit boards and digital displays, while IBM Plex maintains the engineering precision. The IBM Plex Mono + Sans pairing creates visual family consistency. This pairing leans more "precision" than "raw."

#### Pairing C: "The Warehouse"

| Role | Font | Weight(s) | Why |
|------|------|-----------|-----|
| **Display** | **Bebas Neue** | Regular (only weight) | Maximum raw industrial impact — the quintessential gym wall typeface |
| **Sub-heading** | **Barlow Condensed** | SemiBold (600), Bold (700) | Supplements Bebas Neue where weight variation is needed |
| **Body** | **Titillium Web** | Regular (400), SemiBold (600) | European technical documentation feel, motorsport heritage |
| **Data/Mono** | **JetBrains Mono** | Regular (400), Bold (700) | Digital readout clarity |

**Rationale:** Leans hardest into the raw industrial side. Bebas Neue is commanding and unmistakable — it screams competition signage. Titillium Web grounds the body text with technical European precision. This is the most aggressive/bold option. Requires Barlow Condensed as bridge font since Bebas Neue only has one weight.

### 2.4 Typographic Scale

Based on a 1.250 (Major Third) scale for mobile-first, moving to 1.333 (Perfect Fourth) on desktop:

```css
@theme {
  /* Mobile-first type scale (Major Third 1.250) */
  --text-xs: 0.64rem;     /* 10.24px — fine print, labels */
  --text-sm: 0.8rem;      /* 12.8px — captions, secondary text */
  --text-base: 1rem;      /* 16px — body text */
  --text-lg: 1.25rem;     /* 20px — large body, card titles */
  --text-xl: 1.563rem;    /* 25px — section headings */
  --text-2xl: 1.953rem;   /* 31.25px — page headings */
  --text-3xl: 2.441rem;   /* 39px — hero headings */
  --text-4xl: 3.052rem;   /* 48.8px — display text */
  --text-5xl: 3.815rem;   /* 61px — massive display */
  
  /* Timer/Data special sizes */
  --text-timer: 4.5rem;   /* 72px — main timer display */
  --text-stat: 2.5rem;    /* 40px — stat counters */
}
```

### 2.5 Typography Usage Rules

```css
/* Display headings: Barlow Condensed, ALL CAPS, tight tracking */
.heading-display {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.05em;  /* Slightly expanded for industrial stencil feel */
  font-weight: 800;
  line-height: 0.95;       /* Tight leading for impact */
}

/* Body text: IBM Plex Sans, normal case, relaxed reading */
.body-text {
  font-family: var(--font-body);
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.01em;
}

/* Data/stats: JetBrains Mono, tabular figures */
.data-text {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;  /* Slightly tighter for instrument feel */
  font-weight: 400;
}

/* Timer display: JetBrains Mono at hero size */
.timer-display {
  font-family: var(--font-mono);
  font-size: var(--text-timer);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}
```

---

## 3. Comprehensive Animation Strategy

### 3.1 Motion Principles for "Raw Industrial + Precision Coaching"

The motion language must reflect **mechanical precision with weight**. Think hydraulic press, not butterfly. Industrial machinery, not organic flow.

| Principle | Description | Anti-Pattern |
|-----------|-------------|-------------|
| **Weighted & purposeful** | Elements have mass — they accelerate and decelerate like heavy objects | Floaty, wispy, ethereal movements |
| **Sharp & decisive** | Short durations, confident easing — no hesitation | Long, lazy transitions |
| **Sequential precision** | Staggered reveals suggest a checklist being completed or stations being activated | Everything appearing simultaneously |
| **Mechanical rhythm** | Consistent timing patterns — like a metronome or machine cycle | Random, chaotic timing |
| **Restrained celebration** | Even celebrations feel controlled — precision confetti, not party chaos | Over-the-top bouncing, excessive particles |

### 3.2 Easing Curves & Spring Configurations

```typescript
// === CORE EASING CURVES ===

// "Industrial Snap" — Primary easing for most UI transitions
// Fast-in, sharp deceleration: like a hydraulic mechanism snapping into place
const INDUSTRIAL_SNAP = [0.16, 1, 0.3, 1] as const;
// Tailwind CSS: transition-[cubic-bezier(0.16,1,0.3,1)]

// "Precision Ease" — For data reveals and chart animations
// Smooth and measured, like a precision instrument settling
const PRECISION_EASE = [0.33, 1, 0.68, 1] as const;
// Similar to ease-out but with more control at the start

// "Machine Press" — For heavy/impactful animations (modal reveals, drawer opens)
// Accelerates aggressively, then locks into position
const MACHINE_PRESS = [0.22, 0.68, 0, 1] as const;

// === SPRING CONFIGURATIONS ===

// "Tight Industrial" — For micro-interactions (buttons, toggles, small reveals)
const SPRING_TIGHT: SpringOptions = {
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

// "Gauge Settle" — For progress rings, gauges, counter animations
const SPRING_GAUGE: SpringOptions = {
  stiffness: 120,
  damping: 20,
  mass: 1,
};

// "Heavy Machinery" — For page transitions, large modal reveals
const SPRING_HEAVY: SpringOptions = {
  stiffness: 200,
  damping: 28,
  mass: 1.2,
};

// "Quick Snap" — For toggles, checkbox states, small state changes
const SPRING_SNAP: SpringOptions = {
  stiffness: 500,
  damping: 35,
  mass: 0.5,
};
```

### 3.3 Page Load Orchestration

```typescript
import { motion, stagger, useAnimate } from "motion/react";

// === STAGGERED PAGE LOAD PATTERN ===
// Elements appear like a system booting up — header first, then content blocks
// in rapid succession, like equipment status lights activating

const PAGE_LOAD_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,  // 60ms stagger — fast, mechanical rhythm
      delayChildren: 0.1,     // 100ms initial delay
    },
  },
};

const ITEM_VARIANTS = {
  hidden: { 
    opacity: 0, 
    y: 12,           // Small vertical offset — subtle, not dramatic
    filter: "blur(4px)"  // Slight blur for "focusing in" effect
  },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],  // Industrial Snap
    },
  },
};

// Usage:
// <motion.div variants={PAGE_LOAD_VARIANTS} initial="hidden" animate="visible">
//   <motion.div variants={ITEM_VARIANTS}>Header</motion.div>
//   <motion.div variants={ITEM_VARIANTS}>Stat Card 1</motion.div>
//   <motion.div variants={ITEM_VARIANTS}>Stat Card 2</motion.div>
//   <motion.div variants={ITEM_VARIANTS}>Chart</motion.div>
// </motion.div>
```

**Direction logic:**
- **Top-level navigation/header:** Slides down from top (`y: -20 → 0`)
- **Content cards:** Fade up from below (`y: 12 → 0`)  
- **Side panels/drawers:** Slide from respective edge (`x: ±300 → 0`)
- **Modals:** Scale up from center with opacity (`scale: 0.95, opacity: 0 → scale: 1, opacity: 1`)
- **Data values:** No movement, just opacity + blur clear (`opacity: 0, filter: blur(4px) → 1, blur(0)`)

### 3.4 Scroll-Triggered Animations

```typescript
import { motion, useScroll, useTransform, useSpring } from "motion/react";

// === SCROLL-TRIGGERED: Cards and content blocks ===
// Use whileInView for "activate on scroll" — like stations lighting up as you approach

const ScrollRevealCard = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}  // Trigger 80px before entering viewport
    transition={{
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    }}
  >
    {children}
  </motion.div>
);

// === SCROLL-LINKED: Progress indicator bar (race progress) ===
const RaceProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-[#FFD700] origin-left z-50"
      style={{ scaleX }}
    />
  );
};

// === SCROLL-LINKED: Parallax station backgrounds ===
const ParallaxStation = ({ children }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  
  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0 opacity-10">
        {/* Background texture/icon */}
      </motion.div>
      {children}
    </div>
  );
};
```

**What to animate on scroll vs. static:**
- ✅ **Animate:** Stat cards, achievement badges, chart containers, section headings, image reveals
- ✅ **Scroll-linked:** Progress bars, parallax backgrounds, header opacity changes
- ❌ **Keep static:** Navigation elements, active timers, critical data readouts, form inputs during use
- ❌ **Never animate on scroll:** Content the user needs to read immediately, interactive elements mid-use

### 3.5 Micro-Interactions

```typescript
// === BUTTON PRESS: Industrial push-button feel ===
const IndustrialButton = ({ children, ...props }) => (
  <motion.button
    whileHover={{ 
      scale: 1.02,
      transition: { duration: 0.15, ease: "easeOut" }
    }}
    whileTap={{ 
      scale: 0.97,        // Slight depression — like pressing a physical button
      transition: { duration: 0.1, ease: "easeIn" }
    }}
    className="bg-[#FFD700] text-black font-display uppercase font-bold 
               px-6 py-3 tracking-wider
               hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]
               active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]
               transition-shadow duration-150"
    {...props}
  >
    {children}
  </motion.button>
);

// === TOGGLE SWITCH: Mechanical snap ===
const IndustrialToggle = ({ isOn, onToggle }) => (
  <motion.button
    onClick={onToggle}
    className={`w-14 h-8 rounded-sm flex items-center px-1
                ${isOn ? 'bg-[#FFD700]' : 'bg-zinc-700'}
                border border-zinc-600`}
  >
    <motion.div
      className="w-6 h-6 bg-zinc-900 rounded-sm"
      animate={{ x: isOn ? 22 : 0 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 35,  // SPRING_SNAP — fast, decisive, no wobble
      }}
    />
  </motion.button>
);

// === HOVER CARD: Subtle elevation shift ===
// Dark mode: Use lighter surface color + subtle glow instead of shadow
const HoverCard = ({ children }) => (
  <motion.div
    whileHover={{
      backgroundColor: "rgba(255, 255, 255, 0.05)",  // Slightly lighter surface
      borderColor: "rgba(255, 215, 0, 0.2)",          // Hint of gold border
      transition: { duration: 0.2 }
    }}
    className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-sm"
  >
    {children}
  </motion.div>
);

// === TAB SWITCHING: Layout animation with underline indicator ===
const TabIndicator = ({ activeTab, tabs }) => (
  <div className="flex gap-0 border-b border-zinc-800">
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => setActive(tab.id)}
              className="relative px-4 py-3 font-display uppercase text-sm tracking-wider">
        {tab.label}
        {activeTab === tab.id && (
          <motion.div
            layoutId="tab-indicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </button>
    ))}
  </div>
);
```

### 3.6 Data Visualization Animation

```typescript
// === PROGRESS RING: Gauge-style fill animation ===
// Inspired by WHOOP strain gauge — animate from 0 to target value
const ProgressRing = ({ progress, size = 120, strokeWidth = 8 }) => {
  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);
  
  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Background track */}
      <circle
        cx={size/2} cy={size/2} r={(size - strokeWidth) / 2}
        fill="none" stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Animated progress arc */}
      <motion.circle
        cx={size/2} cy={size/2} r={(size - strokeWidth) / 2}
        fill="none" stroke="#FFD700"
        strokeWidth={strokeWidth}
        strokeLinecap="butt"  // Sharp ends — industrial, not rounded
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - progress) }}
        transition={{
          duration: 1.2,
          ease: [0.33, 1, 0.68, 1],  // PRECISION_EASE
          delay: 0.3,
        }}
      />
    </svg>
  );
};

// === ANIMATED COUNTER: Stat number counting up ===
// Like a digital readout spinning to its value
import { useMotionValue, useTransform, animate } from "motion/react";

const AnimatedCounter = ({ target, duration = 1.5, decimals = 0 }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => v.toFixed(decimals));
  
  useEffect(() => {
    const controls = animate(count, target, {
      duration,
      ease: [0.33, 1, 0.68, 1],  // PRECISION_EASE
    });
    return controls.stop;
  }, [target]);
  
  return (
    <motion.span className="font-mono tabular-nums text-stat text-[#FFD700]">
      {rounded}
    </motion.span>
  );
};

// === BAR CHART REVEAL: Staggered bars growing from bottom ===
const BarChart = ({ data }) => (
  <div className="flex items-end gap-1 h-40">
    {data.map((value, i) => (
      <motion.div
        key={i}
        className="flex-1 bg-[#FFD700] rounded-t-sm"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        style={{ 
          height: `${value}%`, 
          originY: 1,  // Scale from bottom
        }}
        transition={{
          duration: 0.6,
          delay: i * 0.04,  // 40ms stagger between bars
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    ))}
  </div>
);
```

**How fitness apps handle data reveal (WHOOP/Strava patterns):**
- **WHOOP:** Circular gauges fill clockwise over ~1.2s with ease-out, numeric value counts up simultaneously. Recovery score "punches" in with slight scale overshoot (1.0 → 1.05 → 1.0).
- **Strava:** Split tables populate row-by-row with 30ms stagger. Charts draw left-to-right. Map routes animate along the path.
- **Best practice:** Data should animate on first view only (viewport: once), use PRECISION_EASE for data (not bouncy springs), and complete within 1.5s total for any data visualization sequence.

### 3.7 AI Chat Streaming Text

```typescript
// === AI STREAMING TEXT: Premium typewriter effect ===
// Each word/chunk fades in with slight upward motion
// Feels like a readout being printed, not a cursor typing

const StreamingMessage = ({ content, isStreaming }) => {
  const words = content.split(" ");
  
  return (
    <div className="font-body text-zinc-200 leading-relaxed">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.25,
            delay: i * 0.03,  // 30ms per word
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline"
        >
          {word}{" "}
        </motion.span>
      ))}
      {isStreaming && (
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-2 h-4 bg-[#FFD700] ml-1 align-middle"
        />
      )}
    </div>
  );
};

// Cursor: A pulsing yellow block cursor (■) — like a terminal, 
// reinforcing the "precision instrument" aesthetic
```

### 3.8 Celebration & Achievement Animations

```typescript
// === PR CELEBRATION: Controlled industrial celebration ===
// Not bouncy party confetti — think warning lights activating,
// a precision "CONFIRMED" state

const PRCelebration = () => {
  const [scope, animate] = useAnimate();
  
  const triggerCelebration = async () => {
    // Phase 1: Flash the background gold (0.1s)
    await animate(scope.current, 
      { backgroundColor: ["rgba(255,215,0,0)", "rgba(255,215,0,0.1)", "rgba(255,215,0,0)"] },
      { duration: 0.6, ease: "easeOut" }
    );
    
    // Phase 2: Scale-pop the PR badge
    await animate(".pr-badge",
      { scale: [0, 1.15, 1], opacity: [0, 1] },
      { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    );
    
    // Phase 3: Gold particle burst (use canvas/CSS for performance)
    // Small number of particles (12-16), short lifespan, directional upward
    await animate(".particle",
      { y: [0, -60], opacity: [1, 0], scale: [1, 0.5] },
      { duration: 0.8, delay: stagger(0.03) }
    );
  };
  
  return <div ref={scope}>{/* ... */}</div>;
};

// For confetti specifically, use a lightweight library like 'partycles' 
// or canvas-confetti with restrained settings:
// {
//   particleCount: 20,    // Not 100+ — controlled, not chaotic
//   spread: 45,           // Narrow spread — directed, not random
//   colors: ['#FFD700', '#FFC000', '#FFFFFF'],  // Gold + white only
//   gravity: 1.2,         // Falls quickly — weighted, industrial
//   ticks: 100,           // Short lifespan
// }
```

### 3.9 Page Transitions

```typescript
import { AnimatePresence, motion } from "motion/react";

// === PAGE TRANSITION: "Industrial Shutter" effect ===
// Pages exit by clipping out horizontally (like a shutter closing),
// new page enters by clipping in from the opposite side

const PageTransition = ({ children, key }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={key}
      initial={{ 
        opacity: 0, 
        clipPath: "inset(0 100% 0 0)"  // Clipped from right
      }}
      animate={{ 
        opacity: 1, 
        clipPath: "inset(0 0% 0 0)",   // Fully revealed
        transition: { duration: 0.35, ease: [0.22, 0.68, 0, 1] }
      }}
      exit={{ 
        opacity: 0,
        clipPath: "inset(0 0 0 100%)",  // Clips to left
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
      }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

// === DRAWER/MODAL: Heavy machinery slide ===
const IndustrialDrawer = ({ isOpen, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
        {/* Drawer */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,     // No bounce — heavy, decisive
            mass: 1.0,
          }}
          className="fixed bottom-0 left-0 right-0 z-50 
                     bg-zinc-900 border-t border-zinc-800
                     rounded-t-lg max-h-[90vh]"
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
```

### 3.10 Performance Budget

| Guideline | Value | Rationale |
|-----------|-------|-----------|
| Max simultaneous animations | **8–10** on mobile, **15–20** on desktop | Beyond this, frame drops begin on mid-range mobile devices |
| Animation properties | **Only `transform` and `opacity`** for scroll-linked; `clipPath`, `filter` acceptable for triggered | These are GPU-composited; avoid `width`, `height`, `top`, `left` |
| Max stagger children | **12–15 items** before switching to group animation | Staggering 30+ items creates long sequences that feel slow |
| Stagger interval | **40–80ms** per item | Below 40ms feels like no stagger; above 100ms feels sluggish |
| Total animation sequence | **< 1.5s** for any load sequence | Users perceive > 2s as slow |
| Scroll-linked update rate | Use **`ScrollTimeline` API** via Motion's `useScroll` | Hardware-accelerated, doesn't run on main thread |
| `backdrop-filter: blur()` | **Max 2 simultaneous** on mobile | Expensive compositor operation — each costs ~2ms per frame |
| `will-change: transform` | Apply to **actively animating elements only**, remove after | Prevents compositor layer explosion |
| Reduced motion | **Always respect `prefers-reduced-motion`** | Replace animations with instant state changes or opacity-only fades |

```typescript
// Reduced motion support pattern
import { useReducedMotion } from "motion/react";

const AnimatedComponent = () => {
  const prefersReduced = useReducedMotion();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced 
        ? { duration: 0 }  
        : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
      }
    />
  );
};
```

---

## 4. Atmosphere & Texture Specification

### 4.1 Color System

```css
@theme {
  /* === BASE SURFACES (Dark Elevation System) === */
  /* NOT pure black — use very dark gray with subtle warm tint */
  --color-surface-0: #0A0A0B;    /* Deepest background — app shell */
  --color-surface-1: #111113;    /* Primary content background */
  --color-surface-2: #18181B;    /* Cards, elevated containers */
  --color-surface-3: #1F1F23;    /* Hover states, active surfaces */
  --color-surface-4: #27272B;    /* Modal backgrounds, popovers */
  --color-surface-5: #2E2E33;    /* Highest elevation — tooltips */
  
  /* === ACCENT: Hyrox Yellow === */
  --color-accent: #FFD700;           /* Primary accent — "the yellow" */
  --color-accent-hover: #FFE033;     /* Lighter on hover */
  --color-accent-muted: #FFD70033;   /* 20% opacity — glows, backgrounds */
  --color-accent-subtle: #FFD70015;  /* 8% opacity — very subtle tints */
  
  /* === TEXT HIERARCHY === */
  --color-text-primary: #F4F4F5;     /* zinc-100 — primary text */
  --color-text-secondary: #A1A1AA;   /* zinc-400 — secondary/labels */
  --color-text-tertiary: #71717A;    /* zinc-500 — disabled/hint */
  --color-text-inverse: #0A0A0B;     /* For text on yellow accent backgrounds */
  
  /* === SEMANTIC COLORS === */
  --color-success: #22C55E;   /* Green — PRs, completions, recovery */
  --color-warning: #EAB308;   /* Amber — approaching limits, caution */
  --color-danger: #EF4444;    /* Red — errors, max strain, overtraining */
  --color-info: #3B82F6;      /* Blue — informational, AI responses */
  
  /* === BORDER COLORS === */
  --color-border-default: #27272A;    /* zinc-800 — subtle container borders */
  --color-border-hover: #3F3F46;      /* zinc-700 — hover state borders */
  --color-border-accent: #FFD70040;   /* Yellow 25% — accent borders */
}
```

### 4.2 Background Treatments

#### Subtle Noise/Grain Overlay (CSS-Only, Performant)

```css
/* === NOISE TEXTURE — SVG-based, inlined, zero network requests === */

/* Utility class for grain overlay */
.grain::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.03;  /* Very subtle — 3% opacity */
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}

/* Tailwind v4 plugin approach — add to your CSS: */
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

**Performance notes:**
- SVG `feTurbulence` is rasterized once by the browser and cached — negligible performance impact
- Using `mix-blend-mode: overlay` on a `::before` pseudo-element keeps it off the compositing critical path
- At 3% opacity, it's felt but not seen — adds "rawness" to surfaces subconsciously
- No image files, no network requests, works offline

#### Gradient Mesh Backgrounds

```css
/* === HERO/DASHBOARD GRADIENT — Dark radial with accent bleed === */
.bg-hero-gradient {
  background: 
    radial-gradient(
      ellipse 80% 50% at 50% 0%,
      rgba(255, 215, 0, 0.06) 0%,     /* Subtle gold glow from top */
      transparent 70%
    ),
    radial-gradient(
      ellipse 60% 60% at 80% 100%,
      rgba(255, 215, 0, 0.03) 0%,     /* Faint gold from bottom-right */
      transparent 50%
    ),
    var(--color-surface-0);
}

/* === CARD GRADIENT — Subtle top-edge light effect === */
.bg-card-gradient {
  background: 
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.03) 0%,    /* Faint light at top edge */
      transparent 40%
    ),
    var(--color-surface-2);
}

/* Tailwind v4 usage: */
/* bg-radial-[ellipse_80%_50%_at_50%_0%] from-[#FFD70010] to-transparent */
```

### 4.3 Shadow Philosophy for Dark UI

Research from Parker Henderson's work on dark mode shadows confirms: **traditional box-shadows are nearly imperceptible in dark mode.** Instead, use a combination of:

1. **Surface color elevation** (primary depth cue)
2. **Subtle border lightening** (secondary depth cue)  
3. **Accent glow** for interactive/important elements (tertiary)
4. **Inner shadows** for inset/pressed states (Tailwind v4's `inset-shadow-*`)

```css
@theme {
  /* === SHADOW SYSTEM — Dark mode optimized === */
  
  /* Level 1: Cards and containers — barely there, surface color does the work */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  
  /* Level 2: Elevated cards on hover */
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  
  /* Level 3: Modals, drawers, popovers */
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.6), 
               0 0 0 1px rgba(255, 255, 255, 0.05);  /* + faint border */
  
  /* Level 4: Dropdowns, tooltips */
  --shadow-xl: 0 16px 50px rgba(0, 0, 0, 0.7),
               0 0 0 1px rgba(255, 255, 255, 0.08);
  
  /* === ACCENT GLOWS === */
  /* Yellow glow for primary CTAs and active states */
  --shadow-glow-sm: 0 0 10px rgba(255, 215, 0, 0.15);
  --shadow-glow-md: 0 0 20px rgba(255, 215, 0, 0.2);
  --shadow-glow-lg: 0 0 40px rgba(255, 215, 0, 0.25),
                    0 0 10px rgba(255, 215, 0, 0.4);
  
  /* === INSET SHADOWS (pressed/active states) === */
  /* Tailwind v4: inset-shadow-* utilities */
  --inset-shadow-sm: inset 0 1px 3px rgba(0, 0, 0, 0.4);
  --inset-shadow-md: inset 0 2px 6px rgba(0, 0, 0, 0.5);
}
```

**Usage rules:**
- Cards at rest: `shadow-sm` + elevated surface color (`surface-2`)
- Cards on hover: `shadow-md` + lighter surface (`surface-3`) + optional accent border glow
- Primary CTA button: `shadow-glow-md` for the yellow button's ambient glow
- Active timer/active workout: `shadow-glow-lg` as a "live/active" indicator
- Pressed states: Use `inset-shadow-sm` to simulate physical depression

### 4.4 Border Treatments

```css
/* === BORDER PHILOSOPHY ===
   Raw Industrial = Sharp, 90° corners, thin precise lines
   NOT rounded/bubbly — that's consumer-friendly, not industrial
   
   Exception: Small interactive elements (toggles, badges) can use 
   rounded-sm (2px) for touch target comfort
*/

/* Default card border: 1px zinc-800 — barely visible, structural */
.card-border {
  border: 1px solid var(--color-border-default);
  border-radius: 2px;   /* rounded-sm — just enough to not look broken */
}

/* Active/selected border: Yellow accent at reduced opacity */
.card-border-active {
  border: 1px solid rgba(255, 215, 0, 0.4);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.08);  /* Subtle glow */
}

/* "Under construction" accent border — left-side only, industrial marking */
.accent-border-left {
  border-left: 3px solid #FFD700;
}

/* Top accent line — like a caution stripe at the top of a card */
.accent-border-top {
  border-top: 2px solid #FFD700;
}
```

**Tailwind classes:**
```html
<!-- Default card -->
<div class="border border-zinc-800 rounded-sm">

<!-- Active/selected card -->
<div class="border border-[#FFD70066] shadow-[0_0_12px_rgba(255,215,0,0.08)] rounded-sm">

<!-- Left accent card (station info, AI insight) -->
<div class="border border-zinc-800 border-l-[3px] border-l-[#FFD700] rounded-sm">
```

### 4.5 Glassmorphism / Backdrop Blur

**When to use glass effects:**
- ✅ **Floating navigation bars** — keeps context while scrolling
- ✅ **Modal/drawer backdrops** — maintains awareness of content beneath  
- ✅ **Sticky headers during scroll** — elegant overlaid navigation
- ❌ **Cards at rest** — feels too soft/consumer; keep them solid and raw
- ❌ **Data displays** — glass effects reduce data legibility
- ❌ **More than 2 simultaneous blurred elements on mobile** — performance killer

```html
<!-- Floating nav bar with glass effect -->
<nav class="fixed top-0 inset-x-0 z-50
            bg-[#0A0A0B]/80 backdrop-blur-md
            border-b border-zinc-800/50">

<!-- Modal backdrop -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm">
```

### 4.6 Depth & Layering System

Based on dark mode elevation research, lighter surfaces = higher elevation:

```
┌─────────────────────────────────────────────────┐
│  Layer 0: App Background        #0A0A0B         │
│  ┌─────────────────────────────────────────────┐ │
│  │  Layer 1: Content Areas      #111113        │ │
│  │  ┌─────────────────────────────────────────┐│ │
│  │  │  Layer 2: Cards           #18181B       ││ │
│  │  │  ┌─────────────────────────────────────┐││ │
│  │  │  │  Layer 3: Hover/Active #1F1F23      │││ │
│  │  │  │  ┌─────────────────────────────────┐│││ │
│  │  │  │  │  Layer 4: Modals    #27272B     ││││ │
│  │  │  │  │  ┌─────────────────────────────┐││││ │
│  │  │  │  │  │  Layer 5: Tooltip #2E2E33  │││││ │
│  │  │  │  │  └─────────────────────────────┘││││ │
│  │  │  │  └─────────────────────────────────┘│││ │
│  │  │  └─────────────────────────────────────┘││ │
│  │  └─────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

Each step: ~4-5% lighter in lightness (using oklch for perceptual uniformity)
```

### 4.7 The #FFD700 Accent Color Strategy

**Core principle:** The yellow is the "high-voltage warning label" of the UI. It should be **impossible to ignore** when present, which means it must be **extremely scarce** in any given view.

**Usage Hierarchy (most to least emphasis):**

| Usage | Treatment | Frequency |
|-------|-----------|-----------|
| **Primary CTA** | Solid #FFD700 fill, black text | 1 per screen max |
| **Active timer / Live indicator** | Pulsing glow, solid fill | 1 per screen max |
| **Progress rings / Gauges** | #FFD700 stroke on ring | 2-3 per screen |
| **Accent borders** | Left/top border-left: 3px solid | 2-4 per screen |
| **Data highlights** | Text color for key metrics | 3-5 per screen |
| **Hover/Active states** | Border glow, background tint (#FFD70008) | On interaction only |
| **Icon accents** | Selected nav icon, active station marker | Minimal |
| **Never:** | Large background fills, full-width bars, body text | — |

**Yellow-on-dark contrast ratio:** #FFD700 on #0A0A0B = **13.5:1** — exceeds WCAG AAA. Excellent.

**Yellow-on-dark text:** #0A0A0B on #FFD700 = **13.5:1** — perfect for button text.

**Caution stripe implementation:**
```css
/* Decorative caution stripe — for section dividers, achievement banners */
.caution-stripe {
  background: repeating-linear-gradient(
    -45deg,
    #FFD700,
    #FFD700 10px,
    #0A0A0B 10px,
    #0A0A0B 20px
  );
  height: 4px;  /* Thin — decorative, not overwhelming */
  opacity: 0.6; /* Slightly muted */
}

/* Tailwind v4: */
/* bg-[repeating-linear-gradient(-45deg,#FFD700,#FFD700_10px,#0A0A0B_10px,#0A0A0B_20px)] h-1 opacity-60 */
```

---

## 5. Differentiation: Signature UI Identity

### 5.1 The Signature Element: "The 8-Station Race Track"

**Concept: The Station Progress Rail**

Just as WHOOP has its strain gauge circle and Peloton has its leaderboard, the Hyrox AI Coach signature element is **"The Rail"** — a horizontal or vertical 8-segment progress indicator representing the 8 run+station blocks of a Hyrox race.

```
Visual concept:

RUN → [SKI ERG] → RUN → [SLED PUSH] → RUN → [SLED PULL] → RUN → [BURPEES] →
▓▓▓▓▓  ████████   ▓▓▓▓▓  ████████████  ▓▓▓▓▓  █████████   ▓▓▓▓▓  ████████  

RUN → [ROWING] → RUN → [FARMERS] → RUN → [LUNGES] → RUN → [WALL BALLS]
▓▓▓▓▓  ████████  ▓▓▓▓▓  ██████████  ▓▓▓▓▓  █████████  ▓▓▓▓▓  ██████████████

▓ = Run segment (narrower, zinc-700)
█ = Station segment (wider, colored by station type)
```

**Implementation:**
- **8 segments** separated by thin gaps (2px), each representing one station block
- **Run portions** are narrower, darker segments between stations
- **Active station** is highlighted in #FFD700 with a subtle pulse glow
- **Completed stations** fill with the station's color (muted) from left to right
- **Upcoming stations** remain dark (surface-2)
- This rail appears at the **top of the dashboard**, in **workout views**, and as a **progress header** during active workouts
- It becomes the app's visual fingerprint — instantly recognizable, deeply Hyrox-specific

```typescript
// Simplified Station Rail component concept
const StationRail = ({ currentStation, completedStations }) => {
  const stations = [
    { id: 'ski', label: 'SKI ERG', color: '#3B82F6' },
    { id: 'push', label: 'SLED PUSH', color: '#EF4444' },
    { id: 'pull', label: 'SLED PULL', color: '#F97316' },
    { id: 'burpee', label: 'BURPEES', color: '#8B5CF6' },
    { id: 'row', label: 'ROWING', color: '#06B6D4' },
    { id: 'carry', label: 'FARMERS', color: '#22C55E' },
    { id: 'lunge', label: 'LUNGES', color: '#EC4899' },
    { id: 'wall', label: 'WALL BALLS', color: '#EAB308' },
  ];

  return (
    <div className="flex gap-0.5 h-2 w-full">
      {stations.map((station, i) => (
        <React.Fragment key={station.id}>
          {/* Run segment */}
          <motion.div 
            className="flex-[1] rounded-sm"
            animate={{
              backgroundColor: completedStations.includes(i) 
                ? 'rgba(255, 215, 0, 0.3)' 
                : '#27272A'
            }}
          />
          {/* Station segment */}
          <motion.div
            className="flex-[2] rounded-sm relative"
            animate={{
              backgroundColor: 
                currentStation === i ? '#FFD700' :
                completedStations.includes(i) ? station.color + '80' :
                '#27272A',
              boxShadow: currentStation === i 
                ? '0 0 12px rgba(255, 215, 0, 0.4)' 
                : 'none',
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </React.Fragment>
      ))}
    </div>
  );
};
```

### 5.2 Industrial Design Elements Tastefully Incorporated

#### Station Number Markers
```html
<!-- Large stencil-style station numbers — like gym floor markings -->
<div class="font-display text-[120px] font-black text-zinc-800/30 
            absolute -top-8 -right-4 select-none leading-none
            tracking-tight uppercase">
  04
</div>
<!-- The oversized, semi-transparent station number sits BEHIND content,
     like a number painted on a warehouse wall -->
```

#### Exposed Grid / Structural Lines
```html
<!-- Visible grid lines in dashboard backgrounds — like engineering paper -->
<div class="bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] 
            bg-[size:24px_24px]">
  <!-- Content sits on a subtle visible grid — engineering precision -->
</div>
```

#### "Equipment Label" Micro-Pattern
```html
<!-- Small utility labels styled like equipment nameplates -->
<span class="font-display text-[10px] uppercase tracking-[0.2em] 
             text-zinc-500 border border-zinc-700 px-2 py-0.5 
             rounded-sm bg-zinc-900">
  VO2 MAX EST.
</span>
<!-- Feels like a label plate riveted to gym equipment -->
```

#### Hazard/Caution Stripe Accents
```html
<!-- Achievement banner with caution stripe -->
<div class="relative overflow-hidden">
  <div class="bg-[repeating-linear-gradient(-45deg,#FFD700,#FFD700_8px,transparent_8px,transparent_16px)] 
              absolute inset-0 opacity-10" />
  <div class="relative z-10 py-3 px-4 text-center">
    <span class="font-display uppercase font-bold text-[#FFD700] tracking-wider">
      NEW PERSONAL RECORD
    </span>
  </div>
</div>
```

#### "Stamped/Stenciled" Watermarks
```html
<!-- Workout type stamp — like a stenciled classification on a crate -->
<div class="relative">
  <div class="absolute top-4 right-4 -rotate-12 border-2 border-[#FFD700]/20 
              rounded-sm px-3 py-1 font-display text-xs uppercase tracking-widest 
              text-[#FFD700]/20 font-bold">
    ELITE
  </div>
</div>
```

### 5.3 Apps That Nail "Premium Dark Industrial"

For further visual inspiration (describe what to look for):

1. **Arc Browser** — Uses subtle noise/grain on dark backgrounds, sharp UI with accent colors, premium feel without being flashy
2. **Linear (project management)** — Dark mode with extreme precision, keyboard-first feel, subtle gradients, crisp type hierarchy
3. **Vercel Dashboard** — Dark industrial developer

---

## Sources

- [Kokonut UI - Open Source Components](https://kokonutui.com)
- [Framer Motion is now independent, introducing Motion](https://motion.dev/magazine/framer-motion-is-now-independent-introducing-motion)
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [kokonut-labs/kokonutui: Collection of UI components. Built ...](https://github.com/kokonut-labs/kokonutui)
- [Motion — JavaScript & React animation library](https://motion.dev)
- [Tailwind CSS v4.1: Text shadows, masks, and tons more](https://tailwindcss.com/blog/tailwindcss-v4-1)
- [KokonutUI: A Modern UI Component Library for Next.js](https://www.youtube.com/watch?v=w9OumOqSqqc)
- [Framer Motion is changing… (and I’m excited)](https://www.youtube.com/watch?v=rP_HfAFkQu8)
- [Tailwind v4 Is FINALLY Out – Here’s What’s New (and how to migrate!)](https://www.youtube.com/watch?v=ud913ekwAOQ)
- [KokonutUI Pro - UI Components to build beautiful websites](https://kokonutui.pro)
- [Motion.Dev now becomes independent and uses vanilla ...](https://forums.tumult.com/t/motion-dev-now-becomes-independent-and-uses-vanilla-javascript/24256)
- [3. Css-First Configuration](https://dev.to/joodi/tailwind-css-v40-new-features-and-enhancements-102o)
- [Kokonut UI - DevKit.best](https://www.devkit.best/item/kokonut-ui)
- [Framer Motion](https://www.npmjs.com/package/framer-motion)
- [Tailwind CSS v4.0 Released: Lightning-Fast Builds ...](https://fireup.pro/news/tailwind-css-v4-0-released-lightning-fast-builds-advanced-features-and-simplified-setup)
- [Light & Dark Mode - WHOOP Community](https://www.community.whoop.com/t/light-dark-mode/1034)
- [Fitness & Workout App UI with Dark Mode Training Programs](https://dribbble.com/shots/26810099-Fitness-Workout-App-UI-with-Dark-Mode-Training-Programs)
- [How To Enable Dark Mode in Nike Training Club Tutorial](https://www.youtube.com/watch?v=RPBi4NDmJlY)
- [Whoop app redesign concept - Taras Migulko - Dribbble](https://dribbble.com/shots/26969451-Whoop-app-redesign-concept)
- [Best Dark UI Design for Fitness App - Dribbble](https://dribbble.com/shots/14552783-Best-Dark-UI-Design-for-Fitness-App)
- [Nike Training Club Ui Design Projects - Behance](https://www.behance.net/search/projects/nike%20training%20club%20ui%20design)
- [Whoop Fitness App Design Review](https://www.youtube.com/watch?v=77pKPhgzSS8)
- [🏋️♀️ Fitness Trainer & Workout App UI — Premium Dark Mode Design](https://shop.aboutadi.com/shop/fitness-trainer-workout-app-ui-premium-dark-mode-design/)
- [Nike Dark Mode](https://dribbble.com/shots/14836754-Nike-Dark-Mode)
- [Whoop UI Redesign](https://www.davinnquinn.com/whoop-ui-redesign)
- [Fitness App Ui Projects :: Photos, videos, logos, illustrations and ...](https://www.behance.net/search/projects/fitness%20app%20ui)
- [Nike / NTC Design System](http://www.oscar-w.com/projects/design-system)
- [Using our logo](https://developer.whoop.com/assets/files/WHOOP%20-%20Brand%20&%20Design%20Guidelines-bdea3554e94b4ea09e68695b1e8dc8e7.pdf)
- [Fitness App - Darkmode Minimalism | Figma](https://www.figma.com/community/file/1328586164766653621/fitness-app-darkmode-minimalism)
- [Nike Training App Design for Men, Women & Others UI/UX/Interaction in Adobe XD](https://www.youtube.com/watch?v=OBzvsi55cR4)
- [Barlow Condensed | Adobe Fonts](https://fonts.adobe.com/fonts/barlow-condensed)
- [Dark mode - Core concepts - Tailwind CSS](https://tailwindcss.com/docs/dark-mode)
- [brand-guidelines](https://www.hyrox365.com/meta-pages/brand-guidelines)
- [Barlow | Adobe Fonts](https://fonts.adobe.com/fonts/barlow)
- [Dark Mode - Tailwind CSS](https://tailwindcss-com.vercel.app/docs/dark-mode)
- [Hyrox - Wikipedia](https://en.wikipedia.org/wiki/Hyrox)
- [Barlow Condensed](https://brand.berkeley.edu/visual-identity/typography/)
- [Noisy/Grainy backgrounds and gradients in CSS](https://www.bstefanski.com/blog/noisygrainy-backgrounds-and-gradients-in-css)
- [How to Host a Successful Hyrox Community Event: Planning and Promotion Tips](https://ballinfit.nl/blogs/community/how-to-host-a-successful-hyrox-community-event-planning-and-promotion-tips)
- [Barlow Condensed by Google Fonts](https://typographer.com/fonts/gf-barlow-condensed/)
- [Enabling for other utilities](https://v2.tailwindcss.com/docs/dark-mode)
- [Designing Event Visuals That Match Themes and Brand Identity](https://go2productions.com/blog/designing-event-visuals-that-match-themes-and-brand-identity/)
- [Best Sports Google Fonts - Graphic Pie](https://www.graphicpie.com/sports-google-fonts/)
- [How To Implement Dark Theme In Tailwind CSS With ...](https://www.tailwindtap.com/blog/how-to-implement-dark-theme-in-tailwind-css)
- [Event Branding Experts ✷ Stunning Graphics for Unforgettable Events](https://www.eventbranding.design)
- [fitIQ - Supercharge your WHOOP Analytics](https://fitiq.io)
- [How to Create Grainy CSS Backgrounds Using SVG Filters](https://www.freecodecamp.org/news/grainy-css-backgrounds-using-svg-filters/)
- [Mastering transitions and easing in Framer (Animation Lesson 3)](https://www.youtube.com/watch?v=bOgUXDibygM&vl=en)
- [Visualizing Strava data](https://www.youtube.com/watch?v=-mL_9vwFSgI)
- [Grainy Backgrounds with CSS and SVG Filters](https://www.youtube.com/watch?v=vi-vi4_UpqM)
- [Best Practices with Framer Motion and React Spring](https://www.ruixen.com/blog/react-anim-framer-spring)
- [How Whoop Perfected Data Visualization](https://matthewritchey.com/2023/11/12/whoop-and-perfecting-data-visualization/)
- [Make Your Web Images More Realistic With SVG Grainy Filters (Noise)](https://www.youtube.com/watch?v=1bYAwpPPD6U&vl=en)
- [Animating Components in React: Best Practices with Framer Motion and ...](http://www.ruixen.com/blog/react-anim-framer-spring)
- [Visualizer | Strava Apps – There's one for every athlete.](https://www.strava.com/apps/visualizer)
- [The Easing Blueprint - Reuben Rapose](https://www.reubence.com/articles/the-easing-blueprint)
- [How to Build Beautiful Visualization with Strava and Tableau](https://www.youtube.com/watch?v=SFQ6gQcK1C8)
- [Make Your Web Images More Realistic With SVG Grainy Filters (Noise)](https://www.youtube.com/watch?v=1bYAwpPPD6U&vl=en-US)
- [Chakra Petch - Adobe Fonts](https://fonts.adobe.com/fonts/chakra-petch)
- [good dark mode shadows & elevation](https://www.parker.mov/notes/good-dark-mode-shadows)
- [Warning Stripes CSS Pattern](https://codepen.io/arcayneman/pen/NYKwQg)
- [Chakra Petch - Font Family (Typeface) Free Download TTF, OTF](https://www.fontmirror.com/chakra-petch)
- [Mastering Elevation for Dark UI: A Comprehensive Guide - Uxcel](https://uxcel.com/blog/mastering-elevation-for-dark-ui-a-comprehensive-guide-342)
- [Hazard stripes Vectors - Download Free High-Quality ...](https://www.freepik.com/vectors/hazard-stripes)
- [Chakra Petch by Google Fonts | Typographer](https://typographer.com/fonts/gf-chakra-petch/)
- [Apply shadows properly](https://app.uxcel.com/lessons/dark-mode-uncovered-558/elevation-level-9071)
- [Safety Hazard Background stock illustrations](https://www.istockphoto.com/illustrations/safety-hazard-background)
- [Chakra Petch Font - Figma](https://www.figma.com/fonts/chakra-petch/)
- [Mastering Elevation in Dark Mode: An In-Depth Guide - Its Your Designer](https://itsyourdesigner.co.in/mastering-elevation-in-dark-mode-an-in-depth-guide/)
- [Safety Patterns stock illustrations - iStock](https://www.istockphoto.com/illustrations/safety-patterns)
- [Chakra Petch - Font Viewer - FontVS](https://fontvs.com/font/google/chakra-petch/)
- [Dark mode UI design – 7 best practices - Atmos Style](https://atmos.style/blog/dark-mode-ui-best-practices)
- [Hazard stripes Palette - Lospec](https://lospec.com/palette-list/hazard-stripes)
- [HYROXLON_VenueMap](https://hyrox.com/wp-content/uploads/2024/05/HYROXLON_VenueMap.pdf)
- [React scroll animation — scroll-linked & parallax | Motion](https://motion.dev/docs/react-scroll-animations)
- [IBM Plex Sans Font Combinations & Similar Fonts - Typewolf](https://www.typewolf.com/ibm-plex-sans)
- [HYROXMAN_VenueMap](https://hyroxitaly.com/wp-content/uploads/2024/11/HYROXMAN_VenueMap.pdf)
- [useScroll — React scroll-linked animations - Motion.dev](https://motion.dev/docs/react-use-scroll)
- [Choosing Fonts](https://www.ryanfiller.com/blog/choosing-fonts)
- [HYROX Turin](https://hyrox.com/event/hyrox-turin/)
- [useScroll | Motion for React (之前名为 Framer Motion)](https://motion.net.cn/docs/react-use-scroll)
- [How To Pair Fonts For...](https://www.networksolutions.com/blog/best-fonts-for-website/)
- [FAQ](https://hyrox.com/faq/)
- [Implementing React scroll animations with Framer Motion](https://blog.logrocket.com/react-scroll-animations-framer-motion/)
- [25 best fonts for resumes that get you noticed](https://www.figma.com/resource-library/best-font-for-resume/)
- [HYROX Photos Package - All Your Questions Answeredfitnessexperiment.co › hyrox › photos](https://fitnessexperiment.co/hyrox/photos/)
- [How to Create Scroll Animations with React, Tailwind CSS, and ...](https://www.freecodecamp.org/news/create-scroll-animations-with-framer-motion-and-react/)
- [The Easiest Fonts to Read to Use in Your Websites - Muffin Groupmuffingroup.com › blog › easiest-fonts-to-read](https://muffingroup.com/blog/easiest-fonts-to-read/)
- [What's wrong with the colors](https://forum.freeletics.com/t/whats-wrong-with-the-colors/3885)
- [GitHub - jonathanleane/partycles](https://github.com/jonathanleane/partycles)
- [Exercise indicator turns white in dark mode](https://forum.freeletics.com/t/exercise-indicator-turns-white-in-dark-mode/1381)
- [🎨 Confetti Success Animation in React | No More Boring Toasts! 🎉](https://www.youtube.com/watch?v=VbMr3cnhFhU)
- [[v4] Improve the usage of CSS variables for dark/light mode](https://github.com/tailwindlabs/tailwindcss/discussions/15083)
- [How To Turn On Dark Mode On Freeletics App](https://www.youtube.com/watch?v=IEe7iqiO6HA)
- [Theme variables - Core concepts - Tailwind CSS](https://tailwindcss.com/docs/theme)
- [Freeletics](https://www.designrush.com/best-designs/apps/freeletics)
- [tsParticles | JavaScript Particles, Confetti and Fireworks animations ...](https://particles.js.org)
- [Implementing Dark Mode and Theme Switching using Tailwind v4 ...](https://www.thingsaboutweb.dev/en/posts/dark-mode-with-tailwind-v4-nextjs)
- [React Native Confetti Animation Tutorial 2025 | Celebrate with Paper Explosion Effect](https://www.youtube.com/watch?v=1vd924L-JJI)
- [Dark mode using semantic colors · tailwindlabs tailwindcss · Discussion #10274](https://github.com/tailwindlabs/tailwindcss/discussions/10274)

---

## Original Prompt

```
# Design System Research: "Raw Industrial Meets Precision Coaching" for Hyrox AI Coach App

## Context
We are building a mobile-first fitness coaching app (Hyrox AI Coach) using Next.js 16, React 19, Tailwind CSS v4, Kokonut UI component library, and shadcn/ui. The app is a "coach in your pocket" for Hyrox — a hybrid fitness race combining running with functional workout stations (sled push, sled pull, rowing, wall balls, burpees, ski erg, farmers carry, sandbag lunges). 

Our chosen aesthetic direction is: **"Raw Industrial Meets Precision Coaching"** — the grit of a warehouse gym crossed with the precision of a performance lab. Think exposed steel, concrete textures, sharp data visualization, and the focused energy of an elite training facility.

The app uses dark mode as default with Hyrox brand yellow (#FFD700) as the primary accent.

## Research Objectives

### 1. Visual Identity & Tone References
Research real-world examples of the "raw industrial meets precision coaching" aesthetic in:
- Digital product design (fitness apps, performance dashboards, sports analytics tools)
- Physical spaces (CrossFit boxes, performance labs, Hyrox event venues)
- Brand identities that successfully blend raw/industrial with precision/technical (e.g., Nike Training Club dark mode, WHOOP, Under Armour MapMyRun, Peloton, Freeletics, PUSH Band)
- What specific design elements create the "raw industrial" feeling vs. the "precision coaching" feeling? How do they balance?

### 2. Typography for "Raw Industrial + Precision" Aesthetic
We need to replace Inter (too generic) with distinctive fonts. Research:
- **Display/heading font**: Should feel raw, industrial, athletic — like stencil lettering on gym equipment, warehouse signage, or military precision. Research fonts like: Barlow Condensed, Oswald, Knockout, Druk, Anton, Impact alternatives, Bebas Neue, Rajdhani, Saira, Teko, Chakra Petch, Orbitron, Industry, DIN Condensed, and any other fonts used in elite sports/industrial contexts
- **Body font**: Should feel precise, technical, readable — like instrument panels or engineering specs. Research: DM Sans, IBM Plex Sans, Source Sans Pro, Titillium Web, Exo 2, Saira, Rajdhani, or other technical/engineering-feel sans-serifs
- **Monospace accent font**: For data, timers, stats — should feel like a digital readout or instrument display. Research: JetBrains Mono (already selected), Space Mono, IBM Plex Mono, Fira Code, Overpass Mono
- For each recommendation, explain WHY it fits the "raw industrial meets precision coaching" identity
- Must be available as Google Fonts (free, no licensing issues)
- Show 2-3 complete pairing recommendations with rationale

### 3. Comprehensive Animation Strategy
Research best practices for animation in fitness/performance apps with dark UIs:
- **Page load orchestration**: How should elements appear when a page first loads? Stagger timing, direction, easing curves
- **Scroll-triggered animations**: What elements should animate on scroll vs. be static? Best practices for performance-sensitive scroll animations
- **Micro-interactions**: Hover states, button presses, form interactions, toggle switches — what patterns work for athletic/industrial UIs?
- **Data visualization animation**: How should charts, progress rings, stat counters animate in? Research how WHOOP, Strava, Nike Run Club handle data reveal animations
- **Streaming text animation**: Best approaches for AI chat streaming text that feels premium
- **Celebration/achievement animations**: Confetti, particles, glow effects for PRs and milestones
- **Transition animations**: Page-to-page transitions, tab switches, drawer/modal reveals
- **Motion principles**: What easing curves (spring, ease-out, custom bezier) match industrial/precision feel? Fast-in slow-out vs. linear for different contexts
- **Performance budget**: How many simultaneous animations before mobile performance degrades? Guidelines for 60fps targets
- Use the Motion library (Framer Motion successor) as the animation framework

### 4. Atmosphere & Texture Specification
Research how to create depth and atmosphere in dark-mode athletic UIs:
- **Background treatments**: Subtle noise/grain overlays, gradient meshes, dark concrete textures — what techniques do premium fitness apps use?
- **Shadow philosophy**: How should shadows work in a dark UI? Inner shadows, glows, elevation levels
- **Gradient usage**: Where and how to use gradients in a dark industrial UI — cards, headers, CTAs? What gradient styles match our aesthetic?
- **Border treatments**: Sharp vs. rounded, accent borders, glow borders — what fits "raw industrial"?
- **Overlay/glass effects**: When to use glassmorphism/backdrop-blur and when to keep it raw
- **Texture implementation**: How to add subtle grain/noise textures in Tailwind CSS / Next.js without performance hit (CSS-only approaches preferred)
- **Depth and layering**: How to create visual hierarchy in a predominantly dark UI using subtle elevation cues
- **The Hyrox yellow (#FFD700) as accent**: How to use a strong accent color sparingly for maximum impact — caution tape stripe, warning label aesthetic, industrial safety markings

### 5. Differentiation: What Makes This UI Unforgettable?
Research distinctive UI patterns that could make this app feel unlike generic fitness apps:
- What signature visual element could become the app identity? (e.g., Nike swoosh in UI, WHOOP strain gauge, Peloton leaderboard)
- How can Hyrox unique format (8 stations + 8 runs) inspire the UI structure?
- What industrial design elements (caution striping, stencil typography, exposed grid, hazard markers) can be tastefully incorporated?
- Examples of apps/websites that nail the "premium dark industrial" aesthetic

Deliver all findings in a single comprehensive document with specific CSS/Tailwind values where possible (hex codes, font sizes, easing functions, timing values). Include visual references (describe in detail since you cannot embed images).
```
