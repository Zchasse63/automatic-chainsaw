# Kokonut UI audit for the Hyrox AI Coach app

Kokonut UI is a visually striking, animation-first component library — **not** a full-featured UI toolkit. Across both the free library (42 components) and Pro library (~100+ components), it excels at decorative cards, AI chat inputs, animated text effects, and landing-page sections, but **lacks fundamental application primitives** like charts, data tables, timers, sliders, toggles, and steppers that the Hyrox AI Coach requires for 6 of its 8 screens. The library's biggest strength for this project is its 5 dedicated AI/chat components, which map directly to the AI Coach Chat screen. Building this app will require Kokonut UI as a design-accent layer on top of shadcn/ui primitives, with significant custom component development for data-heavy screens.

Kokonut UI is built by Dorian Baffier, sponsored by Vercel's OSS 2025 Program. It uses a copy-paste philosophy (like shadcn/ui) rather than npm distribution — components install into your project source via the shadcn CLI. The tech stack is **Next.js 16, React 19, Tailwind CSS v4, Motion (Framer Motion successor), and TypeScript**. Pro access costs a one-time **$129** for lifetime access to all components and templates.

---

## Complete free component inventory: 42 components

The open-source library at kokonutui.com ships 42 components organized into four categories. Every component installs via `npx shadcn@latest add @kokonutui/{name}` and lands in `components/kokonutui/` as editable TypeScript source.

### General components (21)

| Component | Slug | Description | Motion Dep | Category |
|-----------|------|-------------|:----------:|----------|
| Slide Text Button | `slide-text-button` | Animated button with vertical text slide on hover | — | Button/Interactive |
| Loader | `loader` | Simple loading animation indicator | — | Feedback |
| Liquid Glass | `liquid-glass-card` | Apple WWDC-inspired glassmorphism card with blur filters | — | Card/Visual |
| Action Search Bar | `action-search-bar` | Search commands panel with keyboard shortcuts and dropdown | ✓ | Navigation/Search |
| Apple Activity Card | `apple-activity-card` | Activity rings (Move/Exercise/Stand) with animated progress | ✓ | Card/Data Display |
| Beams Background | `beams-background` | Customizable animated beam effects for backgrounds | ✓ | Background/Decorative |
| Background Paths | `background-paths` | SVG animated line paths with gradient text | ✓ | Background/Decorative |
| Morphic Navbar | `morphic-navbar` | Dynamic navbar with morphing animation between active items | ✓ | Navigation |
| Mouse Effect Card | `mouse-effect-card` | Card with animated dot pattern responding to cursor position | ✓ | Card/Interactive |
| Bento Grid | `bento-grid` | 4-card responsive grid with varied content and animations | — | Layout |
| Card Flip | `card` | 3D flip animation with front/back card faces | — | Card/Interactive |
| Stack (Card Stack) | `card-stack` | Stacked cards that expand on click, with stats display | ✓ | Card/Interactive |
| Currency Transfer | `currency-transfer` | Multi-step animated transaction flow with exchange rates | ✓ | Finance/Interactive |
| File Upload | `file-upload` | Drag-and-drop upload with animation, SVG/PNG/JPG/GIF up to 5MB | ✓ | Form/Input |
| Profile Dropdown | `profile-dropdown` | User avatar with dropdown menu, name, email, and actions | — | Navigation/User |
| Shapes Hero | `shape-hero` | Falling geometric shapes animation for hero sections | ✓ | Hero/Background |
| Toolbar | `toolbar` | Figma-inspired floating toolbar with action buttons | — | UI Controls |
| X Card (Tweet Card) | `tweet-card` | X/Twitter post card with gradient hover effect | ✓ | Card/Social |
| Team Selector | `team-selector` | Team size selector with avatar display and +/- controls | ✓ | Form/Selection |
| Smooth Tab | `smooth-tab` | Animated tab switcher with smooth transitions (Models, MCPs, Agents, Users) | ✓ | Navigation/Tabs |
| Smooth Drawer | `smooth-drawer` | Smooth slide-in drawer overlay with open/close animation | ✓ | Overlay/Drawer |

### AI components (5) — the library's standout feature

| Component | Slug | Description | Key Features |
|-----------|------|-------------|-------------|
| AI Input Selector | `ai-prompt` | Rich AI chat input with model selector dropdown | Auto-resize textarea, model picker (Claude/GPT), attachment buttons (paperclip, globe, Figma), Enter-to-send/Shift+Enter-newline, conditional send button styling. Uses `useAutoResizeTextarea` hook. |
| AI Input Search | `ai-input-search` | AI chat input with integrated search mode toggle | Dual-mode input switching between chat and search, search action button |
| AI State Loading | `ai-loading` | Collaborative typing/thinking indicators with avatars | Shows "AI is thinking…", multi-user writing indicators ("Sarah Chen, Emma Wilson are writing…"), safety disclaimer text |
| AI Text Loading | `ai-text-loading` | Animated "Thinking…" text for AI processing states | Smooth motion animation for thinking/processing indication |
| AI Voice | `ai-voice` | Voice input interface with recording timer | "Click to speak" CTA, timer display (00:00), recording state management, waveform feedback |

### Text animation components (8)

| Component | Slug | Description |
|-----------|------|-------------|
| Scroll Text | `scroll-text` | Scroll-triggered text animation reveals |
| Typing Text | `typewriter` | Character-by-character typewriter effect with cursor |
| Matrix Text | `matrix-text` | Matrix-style falling character digital rain |
| Dynamic Text | `dynamic-text` | Word/phrase rotation animation switcher |
| Glitch Text | `glitch-text` | Digital glitch/distortion with RGB shifting |
| Shimmer Text | `shimmer-text` | Gradient shimmer sweep across text |
| Sliced Text | `sliced-text` | Text with split/offset visual effect |
| Swoosh Text | `swoosh-text` | Sweeping entrance animation for text |

### Button components (8)

| Component | Slug | Description |
|-----------|------|-------------|
| Particle Button | `particle-button` | Particle burst explosion on click |
| V0 Button | `v0-button` | Vercel V0-styled "Open in V0" button |
| Gradient Button | `gradient-button` | Animated gradient border/background with multiple variants |
| Magnet Button | `attract-button` | Magnetic particle attraction on hover |
| Hold Button | `hold-button` | Press-and-hold to activate with progress indicator |
| Social Button | `social-button` | Social platform-branded buttons (GitHub, Google, X) |
| Command Button | `command-button` | Keyboard shortcut-style button (⌘K) |
| Switch Button | `switch-button` | Animated light/dark theme toggle |

---

## Pro component inventory: ~100+ components behind the paywall

The Pro library at kokonutui.pro uses a separate registry with API key authentication. It focuses on **page-level sections and composed UI patterns** rather than primitives. Installation follows the same shadcn CLI pattern but with the `@kokonutui-pro` registry prefix.

### Blocks and sections (42 confirmed)

| Category | Count | Registry Pattern | Description |
|----------|:-----:|------------------|-------------|
| Hero Sections | 9 | `hero-01` through `hero-09` | Full landing page hero layouts with CTAs, gradients, light effects |
| Feature Sections | 8 | `feature-01` through `feature-08` | Product feature showcase grids and layouts |
| Pricing Sections | 6 | `pricing-01` through `pricing-06` | Pricing table/card designs with plan comparisons |
| Login/Auth Pages | 8 | `login-01` through `login-08` | Complete sign-in/sign-up page designs |
| FAQ Sections | 5 | `accordion-01` through `accordion-05` | Expandable accordion FAQ layouts |
| Footer Sections | 3 | `footer-01` through `footer-03` | Website footer layouts |
| Testimonials | 3 | `testimonials-01` through `testimonials-03` | Customer testimonial displays |

### Individual components (confirmed details)

**Cards (9 variants):** User profile dropdown (card-01), contact/business card (card-02), AI image generator card (card-03), course enrollment card (card-04), checkout/payment card (card-05), job listing card (card-06), poll/voting card (card-07), **analytics dashboard card** (card-08, has "Live" badge, version info, AI-powered insights, hashtag tags), social profile card (card-09).

**Buttons (11 variants):** CTA variants (button-01 through button-03), destructive "Delete" (button-04), "Load More" (button-05), "Share" (button-06), "Download File" (button-07), "Submit Form" (button-08), theme toggle (button-09), "Copy" clipboard (button-10), experimental animated (button-experiment).

**Forms (7 variants):** Contact support with tickets (form-01), **schedule appointment with date/time picker** (form-02), create project (form-03/form-08), feature request (form-03b), **multi-step product customizer** with step counter and dynamic pricing (form-04), flight search with date picker (form-05), **edit profile** (form-06).

**Inputs (10 variants):** Basic text (input-02), labeled (input-03), search with icon (input-04), keyboard shortcut indicator ⌘K (input-05), password (input-07), TouchID/biometric verification (input-08), video recording mode (input-09a), audio recording with timer (input-09b), camera capture (input-09c), fancy/styled (input-09d).

**Other confirmed components:** Modals (count unknown), Animated List (count unknown), Banners (count unknown), Headlines (count unknown), Toolbars (count unknown), Calendar Schedule (1), Team Invite Card (1), Card Recording (1), Sign-in Page (1).

### Templates (7)

| Template | Focus | Price |
|----------|-------|-------|
| Agenta (NEW) | Futuristic design, rich details | $59 individual / $129 lifetime |
| Lume (NEW) | AI/Agents/SaaS startups | $59 / $129 |
| Sonae (NEW) | AI Agents | $59 / $129 |
| AI | AI startup landing page | $59 / $129 |
| Postly | SaaS product sales | $59 / $129 |
| Futur | Physical product sales | $59 / $129 |
| Startup | Modern business template | $59 / $129 |

---

## Technical architecture and dependencies

The library runs on a modern, well-chosen stack. **Tailwind CSS v4** (v4.1.14) uses the new Rust-based Oxide engine for fast compilation. **Motion** (v12.23.24, the Framer Motion successor) powers all animations. The project targets **Next.js 16** with **React 19** and full **App Router** support.

Key dependency details from `package.json`:

- **Radix UI primitives** included: Accordion, Avatar, Dialog, Dropdown Menu, Label, Popover, Progress, Scroll Area, Select, Separator, **Slider**, Slot, Tabs, Tooltip
- **Utility libraries**: `cmdk` (command menu), `vaul` (drawer), `next-themes` (dark mode), `@number-flow/react` (animated numbers), `canvas-confetti` (celebration effects), `zod` (validation), `class-variance-authority` (component variants), `tailwind-merge` + `clsx` (class merging via `cn()`)
- **TypeScript**: 96.2% coverage, v5.9.3, with strict interfaces-over-types convention
- **Dark mode**: Via `next-themes` with Tailwind `dark:` variant classes throughout
- **Linting**: Biome (replaces ESLint + Prettier)
- **Package manager**: Bun preferred

Components install as **source files** into your project — not as node_modules imports. This gives full modification control but means updates require manual reinstallation. The `.cursorrules` file confirms coding conventions: minimize `use client`, favor React Server Components, use functional components with TypeScript interfaces, lowercase-with-dashes directories.

---

## How AI components map to the coach chat screen

The 5 AI components are the library's most directly valuable assets for this project. Here is how they compose into a chat interface:

**AI Input Selector** (`ai-prompt`) serves as the primary message composer. Its auto-resizing textarea, Enter-to-send behavior, attachment buttons, and model selector dropdown can be repurposed — the model selector becomes a coaching-mode selector (e.g., "Training Advice," "Race Strategy," "Recovery Tips"). The `useAutoResizeTextarea` hook handles dynamic input sizing.

**AI State Loading** (`ai-loading`) provides the "coach is thinking" indicator with avatar display. Its multi-user typing indicator pattern ("Sarah Chen is writing…") maps directly to showing "Hyrox Coach is analyzing…" states with the coach avatar.

**AI Text Loading** (`ai-text-loading`) delivers the animated "Thinking…" text for extended processing — useful for complex training plan generation that takes several seconds.

**AI Voice** (`ai-voice`) adds voice input capability with built-in recording timer and state management. This maps to hands-free coaching queries during workouts.

**Typing Text** (`typewriter`) can simulate streaming text output with its character-by-character reveal, though it is a **decorative** component designed for fixed text — not for rendering dynamic API streaming responses. A custom streaming text renderer will still be needed.

**Critical gap**: There are **no chat bubble, message list, or conversation history components** in either library. The entire message display layer — user messages, AI responses with markdown rendering, timestamps, pinned messages, conversation sidebar list — must be built from scratch or sourced from a chat UI library.

---

## Screen-by-screen component mapping

### Screen 1: Onboarding / Profile Setup

| Need | Available Component | Source | Fit |
|------|-------------------|--------|-----|
| Multi-step form | Pro Form 04 (multi-step with Step 1 of 3, Continue button) | Pro | ✅ Good starting point |
| Text inputs | Pro Inputs (10 variants including basic, labeled, search) | Pro | ✅ Strong |
| Login/auth | Pro Login pages (8 variants) + Free Social Button | Pro + Free | ✅ Excellent |
| Profile editing | Pro Form 06 (Edit Profile with avatar, name, email, bio) | Pro | ✅ Direct match |
| File upload | Free File Upload (drag-and-drop with animation) | Free | ✅ For profile photo |
| Team/group selector | Free Team Selector (size selector with +/- controls) | Free | ⚠️ Adaptable for division selection |
| Date picker | Pro Form 02 (has date/time picker for appointments) | Pro | ⚠️ Needs adaptation |
| Slider for RPE | Radix Slider (in dependencies, no Kokonut wrapper) | shadcn | ⚠️ Unstyled primitive |
| Multi-select equipment | — | — | ❌ Build custom |
| Stepper/progress indicator | — | — | ❌ Build custom |
| Radio group / checkbox group | — | — | ❌ Use shadcn primitives |

**Coverage: ~55%** — Forms and inputs are solid, but the stepper, multi-select, and selection primitives need custom work.

### Screen 2: Dashboard (Home)

| Need | Available Component | Source | Fit |
|------|-------------------|--------|-----|
| Layout grid | Free Bento Grid (4-card responsive grid) | Free | ✅ Excellent |
| Activity rings | Free Apple Activity Card (Move/Exercise/Stand rings) | Free | ✅ Perfect for training metrics |
| Card variety | Pro Cards (9 variants) + Free Card Stack | Pro + Free | ✅ Good for workout summaries |
| Animated list | Pro Animated List | Pro | ✅ Activity feed |
| Text effects | Free Dynamic Text, Shimmer Text | Free | ✅ For headlines |
| Animated numbers | `@number-flow/react` (in dependencies) | Bundled | ✅ For stat counters |
| Countdown timer | — | — | ❌ Build custom |
| Charts / graphs | — | — | ❌ Build custom or use Recharts |
| Progress bars | Radix Progress (in dependencies) | shadcn | ⚠️ Unstyled primitive |
| Stat/metric cards | — | — | ❌ Build custom |

**Coverage: ~45%** — Layout and activity visualization are strong, but data display primitives (charts, stats, countdown) are absent.

### Screen 3: AI Coach Chat

| Need | Available Component | Source | Fit |
|------|-------------------|--------|-----|
| Chat input | Free AI Input Selector (rich textarea, attachments, model picker) | Free | ✅ Excellent |
| Search mode | Free AI Input Search | Free | ✅ Direct match |
| Thinking indicator | Free AI State Loading + AI Text Loading | Free | ✅ Excellent |
| Voice input | Free AI Voice (recording with timer) | Free | ✅ Direct match |
| Conversation sidebar | Free Smooth Drawer | Free | ✅ Good for history panel |
| Quick-action buttons | Free Command Button | Free | ✅ Adaptable |
| Chat bubbles / messages | — | — | ❌ Build custom |
| Message list with scrolling | — | — | ❌ Build custom |
| Streaming text renderer | — | — | ❌ Build custom (Typing Text is decorative only) |
| Conversation list | — | — | ❌ Build custom |
| Pin/save functionality | — | — | ❌ Build custom |

**Coverage: ~50%** — Input and loading states are fully covered; the entire message display layer is missing.

### Screen 4: Training Plan View

| Need | Available Component | Source | Fit |
|------|-------------------|--------|-----|
| Week/day tabs | Free Smooth Tab | Free | ✅ Direct match |
| Calendar view | Pro Calendar Schedule | Pro | ⚠️ Details unknown (paywalled) |
| Expandable workout cards | Pro FAQ Accordion components | Pro | ⚠️ Adaptable |
| Card stack | Free Stack (expandable cards with stats) | Free | ✅ Good for daily plans |
| Action buttons | Free Gradient Button, Hold Button | Free | ✅ For "regenerate plan" |
| Progress indicators | — | — | ❌ Build custom |
| Completion checkmarks | — | — | ❌ Build custom |

**Coverage: ~40%** — Tabs and cards provide structure, but training-specific visualizations need custom work.

### Screen 5: Workout Logger

| Need | Available Component | Source | Fit |
|------|-------------------|--------|-----|
| Exercise cards | Pro Cards | Pro | ⚠️ Adaptable |
| Form inputs | Pro Inputs (10 variants) | Pro | ✅ For weight/reps/time entry |
| RPE slider | Radix Slider (dependency, no Kokonut wrapper) | shadcn | ⚠️ Unstyled |
| Completion effect | `canvas-confetti` (in dependencies) | Bundled | ✅ Celebration animation |
| Hold-to-confirm | Free Hold Button | Free | ✅ For set completion |
| Notes textarea | Free AI Input (auto-resize textarea pattern) | Free | ✅ Adaptable |
| Timer | — | — | ❌ Build custom |
| Step-through wizard | — | — | ❌ Build custom |
| Rest timer | — | — | ❌ Build custom |

**Coverage: ~35%** — Input fields work, but the core workout tracking flow (timer, exercise stepper) must be custom-built.

### Screen 6: Performance & Analytics

| Need | Available Component | Source | Fit |
|------|-------------------|--------|-----|
| View tabs | Free Smooth Tab | Free | ✅ For switching analysis views |
| Analytics card | Pro Card 08 (analytics dashboard with "Live" badge) | Pro | ⚠️ Adaptable |
| Charts (line, bar, radar) | — | — | ❌ Use Recharts/Tremor |
| Data tables | — | — | ❌ Use TanStack Table |
| Trend indicators (↑↓) | — | — | ❌ Build custom |
| PR board | — | — | ❌ Build custom |
| Comparison visualization | — | — | ❌ Build custom |

**Coverage: ~15%** — This screen has the poorest Kokonut coverage. It is entirely data-visualization focused, which is outside the library's scope.

### Screen 7: Race Hub

| Need | Available Component | Source | Fit |
|------|-------------------|--------|-----|
| Data entry forms | Pro Forms + Inputs | Pro | ✅ For race result logging |
| Tabs | Free Smooth Tab | Free | ✅ For race sections |
| Cards | Pro Cards | Pro | ⚠️ Adaptable |
| Checklist | — | — | ❌ Build custom |
| Data tables (split times) | — | — | ❌ Use TanStack Table |
| Visual split breakdowns | — | — | ❌ Build custom |
| Comparison tables | — | — | ❌ Build custom |

**Coverage: ~25%** — Forms and tabs provide a skeleton, but race-specific data display is entirely missing.

### Screen 8: Profile & Settings

| Need | Available Component | Source | Fit |
|------|-------------------|--------|-----|
| Profile form | Pro Form 06 (Edit Profile) | Pro | ✅ Direct match |
| Inputs | Pro Inputs (10 variants) | Pro | ✅ Strong |
| Theme toggle | Free Switch Button | Free | ✅ Dark/light mode |
| Section tabs | Free Smooth Tab | Free | ✅ Settings categories |
| Action buttons | Pro Buttons (11 variants) | Pro | ✅ Delete account, export data |
| Dropdown menu | Free Profile Dropdown | Free | ✅ User menu |
| Toggle switches | — | — | ❌ Use shadcn Switch |
| Notification preferences | — | — | ❌ Build custom |

**Coverage: ~65%** — Best-covered screen after onboarding. Standard form/settings patterns align well.

---

## The 14 critical gaps that need filling

After mapping every component to every screen, these are the components Kokonut UI does not provide that the Hyrox AI Coach **must have**:

1. **Chat message bubbles and message list** — The entire message display layer for AI Coach Chat. No chat UI exists in either library. *Recommendation: Build custom using shadcn/ui primitives, or evaluate ai-chatbot templates from Vercel.*

2. **Streaming text renderer** — For displaying AI responses as they generate. Typing Text is decorative (fixed content), not suitable for dynamic API streams. *Recommendation: Build custom with React state + Motion for animation.*

3. **Charts (line, bar, radar, area)** — Performance & Analytics is 80% charts. *Recommendation: Use **Recharts** (already the shadcn/ui charts default) or **Tremor** for pre-styled chart cards.*

4. **Data tables** — Split times, PR boards, race comparisons, exercise logs. *Recommendation: Use **TanStack Table** with shadcn/ui Table primitives.*

5. **Timer / Stopwatch / Countdown** — Active workout tracking, rest timers, race countdown. *Recommendation: Build custom hooks (`useTimer`, `useCountdown`) with @number-flow/react for animated display.*

6. **Multi-step wizard / Stepper** — Onboarding flow, workout exercise walkthrough. *Recommendation: Build custom stepper using Radix Progress + Motion animations.*

7. **Slider with labels** — RPE input (1-10 scale), weight selection. *Recommendation: Style the existing Radix Slider dependency with Kokonut-themed Tailwind classes.*

8. **Toggle switch** — Notification preferences, boolean settings. *Recommendation: Use shadcn Switch (Radix Switch primitive is in dependencies).*

9. **Multi-select / Chip selector** — Equipment access, injury areas, training preferences. *Recommendation: Build custom using cmdk (already in dependencies) for searchable multi-select.*

10. **Checklist component** — Race day checklist, workout completion tracking. *Recommendation: Build custom with checkboxes + animated list patterns from Pro.*

11. **Calendar / Week view** — Training plan calendar display. The Pro Calendar Schedule exists but details are paywalled. *Recommendation: Evaluate Pro Calendar Schedule; if insufficient, use **react-day-picker** (shadcn's calendar default).*

12. **Progress bars / Progress rings** — Weekly volume, plan completion, goal progress. Apple Activity Card provides rings but only in its fixed format. *Recommendation: Build reusable progress ring component inspired by Apple Activity Card's pattern; use Radix Progress for linear bars.*

13. **Stat / Metric cards** — Dashboard number displays (pace, PRs, volume). *Recommendation: Build custom metric cards using Kokonut card styling patterns + @number-flow/react for animated values.*

14. **Toast / Notification system** — Workout saved, plan updated, achievement unlocked feedback. *Recommendation: Use **sonner** (the shadcn/ui default toast library) or react-hot-toast.*

---

## Recommended architecture strategy

The optimal approach treats Kokonut UI as **the design system's visual accent layer** on top of a shadcn/ui primitive foundation, with three supplementary libraries filling data-heavy gaps.

**Layer 1 — shadcn/ui primitives (foundation):** Button, Input, Select, Dialog, Sheet, Tabs, Progress, Switch, Slider, Checkbox, Radio Group, Label, Separator, Scroll Area, Tooltip, Popover, Command, Toast (sonner). These cover all the basic UI primitives Kokonut deliberately omits. Since Kokonut is built on the same Radix + Tailwind stack, the styling integrates seamlessly.

**Layer 2 — Kokonut UI Free (visual components):** AI Input Selector, AI State Loading, AI Text Loading, AI Voice, AI Input Search (chat input layer), Apple Activity Card, Bento Grid (dashboard layout), Smooth Tab, Smooth Drawer, Morphic Navbar, Profile Dropdown, Hold Button, Particle Button, Card Stack, File Upload, Typing Text, Dynamic Text, Shimmer Text (decorative text effects), Switch Button (theme toggle). These **21 free components** provide the app's distinctive animated personality.

**Layer 3 — Kokonut UI Pro ($129):** Forms (multi-step form-04, edit profile form-06, schedule appointment form-02), Inputs (10 styled variants), Cards (9 variants, especially analytics card-08), Calendar Schedule, Animated List, Modals, Login pages (8 variants), FAQ Accordions (for expandable workout details). The Pro investment is justified — **the forms and input components alone** save significant development time across onboarding, workout logging, and settings screens.

**Layer 4 — Supplementary libraries (data gaps):**

- **Recharts** — Line/bar/area charts for performance analytics and trends
- **TanStack Table** — Sortable, filterable data tables for split times and PR boards
- **sonner** — Toast notifications (already shadcn's default)
- **react-day-picker** — Calendar component if Pro Calendar Schedule is insufficient
- **Custom components** — Chat message list, streaming text renderer, timer/countdown, stepper wizard, metric cards, multi-select chips, checklist

**Estimated custom component count: 10-12 components** that must be built from scratch, primarily for the AI Chat message display, workout timer, and data visualization wrappers. The Performance & Analytics screen will require the most custom work, while Profile & Settings and Onboarding will require the least.

This layered approach keeps the Kokonut aesthetic consistent across all screens while filling functional gaps efficiently. The total library cost is **$129** (Pro lifetime) plus **$0** for Recharts, TanStack Table, and sonner (all open source) — a sound investment for a production fitness application.