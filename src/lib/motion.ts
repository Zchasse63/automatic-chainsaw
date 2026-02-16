/**
 * Shared animation constants from B0 Design System.
 * "Raw Industrial Meets Precision Coaching"
 *
 * Motion principles:
 * - Weighted & purposeful: elements have mass
 * - Sharp & decisive: short durations, confident easing
 * - Sequential precision: staggered reveals
 * - Mechanical rhythm: consistent timing
 * - Restrained celebration: controlled precision
 */

// ===== EASING CURVES =====

/** Primary easing — fast-in, sharp deceleration: hydraulic mechanism snapping into place */
export const INDUSTRIAL_SNAP = [0.16, 1, 0.3, 1] as const;

/** Data reveals and chart animations — smooth and measured, precision instrument settling */
export const PRECISION_EASE = [0.33, 1, 0.68, 1] as const;

/** Heavy/impactful (modal reveals, drawer opens) — accelerates aggressively, locks into position */
export const MACHINE_PRESS = [0.22, 0.68, 0, 1] as const;

// ===== SPRING CONFIGURATIONS =====

/** Micro-interactions (buttons, toggles, small reveals) */
export const SPRING_TIGHT = { stiffness: 400, damping: 30, mass: 0.8 };

/** Progress rings, gauges, counter animations */
export const SPRING_GAUGE = { stiffness: 120, damping: 20, mass: 1 };

/** Page transitions, large modal reveals */
export const SPRING_HEAVY = { stiffness: 200, damping: 28, mass: 1.2 };

/** Toggles, checkbox states, small state changes */
export const SPRING_SNAP = { stiffness: 500, damping: 35, mass: 0.5 };

// ===== PAGE LOAD ORCHESTRATION =====

/** Stagger interval between child elements */
export const STAGGER_INTERVAL = 0.06; // 60ms

/** Initial delay before stagger sequence starts */
export const STAGGER_INITIAL_DELAY = 0.1; // 100ms

/** Default item animation for page load */
export const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

/** Item transition using INDUSTRIAL_SNAP */
export const ITEM_TRANSITION = {
  duration: 0.4,
  ease: INDUSTRIAL_SNAP,
};

// ===== SCROLL ANIMATIONS =====

export const SCROLL_VIEWPORT = { once: true, margin: '-80px' as const };
export const SCROLL_DURATION = 0.5;

// ===== MICRO-INTERACTIONS =====

export const HOVER_SCALE = { scale: 1.02 };
export const PRESS_SCALE = { scale: 0.97 };
export const HOVER_TRANSITION = { duration: 0.15, ease: 'easeOut' as const };
export const PRESS_TRANSITION = { duration: 0.1, ease: 'easeIn' as const };

// ===== DATA VISUALIZATION =====

/** Progress ring animation */
export const PROGRESS_RING = { duration: 1.2, ease: PRECISION_EASE };

/** Counter animation */
export const COUNTER_DURATION = 1.5;

/** Bar chart stagger */
export const BAR_STAGGER = 0.04; // 40ms
export const BAR_DURATION = 0.6;

/** Data table row stagger */
export const TABLE_ROW_STAGGER = 0.03; // 30ms

// ===== AI CHAT STREAMING =====

/** Word fade-in animation */
export const WORD_FADE = {
  initial: { opacity: 0, y: 4, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.25 },
};
export const WORD_STAGGER = 0.03; // 30ms per word

// ===== CELEBRATION / PR =====

export const CONFETTI_CONFIG = {
  particleCount: 20,
  spread: 45,
  colors: ['#FFD700', '#FFC000', '#FFFFFF'],
  gravity: 1.2,
  ticks: 100,
};

// ===== PAGE TRANSITIONS =====

export const PAGE_ENTER = {
  initial: { clipPath: 'inset(0 0 0 100%)' },
  animate: { clipPath: 'inset(0 0 0 0%)' },
  transition: { duration: 0.35, ease: MACHINE_PRESS },
};

export const PAGE_EXIT = {
  exit: { clipPath: 'inset(0 100% 0 0)' },
  transition: { duration: 0.25, ease: INDUSTRIAL_SNAP },
};

export const DRAWER_SPRING = { stiffness: 300, damping: 30 };
export const MODAL_VARIANTS = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
};
