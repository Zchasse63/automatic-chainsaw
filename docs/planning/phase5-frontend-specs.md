# Phase 5: Screen-by-Screen Frontend Specs — Hyrox AI Coach

> **Role**: You are a frontend architect and UX designer producing the detailed build specs for every screen of the Hyrox AI Coach web application. Each screen spec is the blueprint Claude Code follows to implement the page. You have access to the Kokonut UI Design Guide (Phase 1 output), the database schema (Phase 2 output), and the API spec (Phase 4 output). You are in planning mode — produce specs, wireframe descriptions, and component trees, not code.

---

## Project Context

### Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Component Libraries**: Kokonut UI (free) + Kokonut UI Pro ($129) + shadcn/ui primitives
- **Animation**: Motion (Framer Motion successor) — bundled with Kokonut
- **Icons**: Lucide React
- **State Management**: (Defined in Phase 4 — reference that document)
- **Data Fetching**: (Defined in Phase 4 — reference that document)

### Component Layer Strategy (from Phase 1 audit)
- **Layer 1 — shadcn/ui**: Button, Input, Select, Dialog, Sheet, Tabs, Progress, Switch, Slider, Checkbox, Radio Group, Label, Separator, Scroll Area, Tooltip, Popover, Command, Toast (sonner)
- **Layer 2 — Kokonut UI Free**: AI Input Selector, AI State Loading, AI Text Loading, AI Voice, AI Input Search, Apple Activity Card, Bento Grid, Smooth Tab, Smooth Drawer, Morphic Navbar, Profile Dropdown, Hold Button, Particle Button, Card Stack, File Upload, Typing Text, Dynamic Text, Shimmer Text, Switch Button
- **Layer 3 — Kokonut UI Pro**: Forms (multi-step form-04, edit profile form-06, schedule form-02), Inputs (10 variants), Cards (9 variants, especially analytics card-08), Calendar Schedule, Animated List, Modals, Login pages (8 variants), FAQ Accordions
- **Layer 4 — Supplementary**: Recharts (charts), TanStack Table (data tables), sonner (toasts), react-day-picker (calendar)
- **Custom builds needed**: Chat message bubbles/list, streaming text renderer, timer/countdown, stepper wizard, slider with labels, multi-select chips, checklist, stat/metric cards, progress rings

### Design Philosophy
Mobile-first responsive web app. Dark mode supported. Every screen answers a question the athlete is asking:
- Dashboard: "What should I do today? Am I on track?"
- AI Coach: "Help me with X"
- Training: "What's my plan this week?"
- Workout Logger: "Let me record what I just did"
- Performance: "Am I getting faster? What are my weak stations?"
- Race Hub: "How did my race go? Am I ready for the next one?"
- Profile: "Update my info"

---

## Navigation Structure

### Primary Navigation (persistent across all screens)
**Mobile (< 768px)**: Bottom tab bar, 5 items
**Desktop (≥ 768px)**: Left sidebar (collapsible) or top nav bar

| Tab | Icon (Lucide) | Route | Label |
|-----|--------------|-------|-------|
| Home | `Home` or `LayoutDashboard` | `/dashboard` | Dashboard |
| Coach | `MessageSquare` or `Bot` | `/coach` | AI Coach |
| Training | `Dumbbell` or `CalendarDays` | `/training` | Training |
| Performance | `TrendingUp` or `BarChart3` | `/performance` | Progress |
| Profile | `User` | `/profile` | Profile |

**Secondary access (not in primary nav):**
- Workout Logger: Launched from Training screen or Dashboard "Start Workout" CTA → `/training/log`
- Race Hub: Accessed from Performance screen or Dashboard → `/races`
- Settings: Accessed from Profile screen → `/profile/settings`

**Component**: Use Kokonut's **Morphic Navbar** for desktop, build a custom bottom tab bar for mobile using Kokonut's animation patterns.

---

## Screen Specs

### For EACH screen, provide:

1. **Route & Layout**: Next.js route path, which layout wraps it, auth requirement
2. **User Story**: What question does this screen answer? What's the primary action?
3. **Component Tree**: Hierarchical breakdown of every UI element, specifying which library each component comes from (Kokonut Free / Kokonut Pro / shadcn / Recharts / Custom)
4. **Data Requirements**: Which API endpoints feed this screen, what data loads on mount vs. on interaction
5. **States**: Loading state, empty state, error state, populated state — describe each
6. **Interactions**: Every clickable/tappable element and what it does
7. **Responsive Behavior**: How the layout changes between mobile (<768px) and desktop (≥1024px)
8. **Animations**: Which Kokonut/Motion animations apply where
9. **Dark Mode**: Any special considerations for dark mode styling

---

## Screens to Spec

### Screen 0: Landing / Auth Pages
- Routes: `/` (landing), `/login`, `/signup`, `/forgot-password`
- Use Kokonut Pro Login pages as base
- Landing page: Brief product pitch → CTA to sign up
- After auth: Redirect to `/onboarding` if no profile exists, else `/dashboard`

### Screen 1: Onboarding / Profile Setup
- Route: `/onboarding`
- Multi-step form wizard (3-5 steps)
- **Step 1**: Name, age/DOB, sex → basic identity
- **Step 2**: Hyrox experience (race count, division, experience level) → athletic background
- **Step 3**: Current training (running volume, strength days, weekly hours, equipment access) → training context
- **Step 4**: Race goals (race date or "no race planned", goal time) → targets
- **Step 5** (optional): Injuries/limitations, preferences → safety context
- Minimum viable: Steps 1-3 required, Steps 4-5 skippable
- On completion: Create athlete_profile → redirect to `/dashboard`
- Component: Kokonut Pro Form 04 (multi-step) as base, custom stepper indicator

### Screen 2: Dashboard (Home)
- Route: `/dashboard`
- **Primary question**: "What should I do today? Am I on track?"
- **Data**: `GET /api/dashboard` (aggregate endpoint)
- **Layout**: Bento Grid (Kokonut) with cards for:
  - Race countdown (days until race_date) — large, prominent
  - Today's workout from training plan — with "Start" CTA
  - Weekly training summary (workouts completed / planned, total hours)
  - Training streak counter
  - Quick stats: estimated race time, recent PRs
  - Recent AI coaching insights (last conversation snippet)
  - Activity feed (recent workouts logged) — Kokonut Animated List (Pro)
- **Apple Activity Card**: Repurpose for weekly training rings (Running hours / Station work hours / Recovery sessions)
- **Empty state**: New user with profile but no data → show "Get started" prompts (log a workout, chat with coach, set a goal)

### Screen 3: AI Coach Chat
- Route: `/coach` (conversation list) and `/coach/:conversationId` (active chat)
- **Primary question**: "Help me with X"
- **This is the most complex screen — spec it in extreme detail**
- **Layout**:
  - Mobile: Full-screen chat with conversation list accessible via Smooth Drawer
  - Desktop: Two-panel — conversation sidebar (left, 280px) + active chat (right, flex)
- **Conversation List Panel**:
  - New conversation button (prominent)
  - List of past conversations (title, last message preview, timestamp)
  - Active conversation highlighted
  - Search conversations (optional)
- **Chat Area**:
  - Message list (scrollable, auto-scroll to bottom on new messages)
  - User message bubbles (right-aligned, brand color)
  - Coach K message bubbles (left-aligned, with coach avatar)
  - Markdown rendering in coach responses (headers, bold, lists, code blocks)
  - Thumbs up/down on each coach message
  - Pinnable messages
  - Streaming text animation as tokens arrive
  - "Coach K is thinking..." indicator (AI State Loading)
  - "Coach K is warming up..." for cold start (>5s delay)
- **Input Area**:
  - Kokonut AI Input Selector as base
  - Repurpose model selector dropdown as coaching mode selector (optional)
  - Auto-resize textarea
  - Enter to send, Shift+Enter for newline
  - Voice input toggle (Kokonut AI Voice)
  - Quick-action suggestion chips above input: "Analyze my last race," "Build a sled push workout," "Am I ready for race day?", "What should I do today?"
- **Data Flow**:
  - On mount: `GET /api/conversations` → populate sidebar
  - On select conversation: `GET /api/conversations/:id/messages` → populate chat
  - On send: `POST /api/chat` → SSE stream → append tokens to UI → save after [DONE]
  - New conversation: `POST /api/conversations` → navigate to new chat

### Screen 4: Training Plan View
- Route: `/training` (plan overview) and `/training/plans/:id` (specific plan)
- **Primary question**: "What's my plan this week? What's coming up?"
- **Layout**:
  - Active plan header (plan name, progress, weeks remaining)
  - Week selector tabs (Kokonut Smooth Tab)
  - Day-by-day view within selected week
  - Each day: expandable card showing workout details
  - Completed days: checkmark + completion indicator
  - Rest days: styled differently
  - "Log this workout" CTA on each day → opens Workout Logger
- **No active plan state**: Prompt to create one (manual or "Ask Coach K to create one")
- **Plan management**: Archive, create new, view past plans

### Screen 5: Workout Logger
- Route: `/training/log` (new) or `/training/log/:workoutLogId` (editing)
- **Primary question**: "Let me record what I just did"
- **Two entry modes**:
  - Quick log: Date, session type, duration, RPE, notes → save
  - Detailed log: Exercise-by-exercise with sets/reps/weight/time → save
- **If launched from training plan day**: Pre-populate with prescribed workout
- **Timer**: Built-in timer for timed exercises and rest periods
- **RPE slider**: 1-10 scale with labeled descriptions (1="Very Easy" → 10="Maximal")
- **Session types**: Run, HIIT, Strength, Simulation, Recovery (tabs or selector)
- **On save**: Create workout_log → check for PR → show toast/celebration if new PR → invalidate dashboard + workout list

### Screen 6: Performance & Analytics
- Route: `/performance`
- **Primary question**: "Am I getting faster? Where are my weak points?"
- **Tabs** (Kokonut Smooth Tab): Overview / Stations / Running / Benchmarks
- **Overview tab**:
  - Estimated race time trend (line chart — Recharts)
  - PR board: all personal records with trend arrows (↑ improved, → flat)
  - Training volume chart (weekly hours over time)
  - Strength/weakness radar chart (8 stations on axes)
- **Stations tab**:
  - Station-by-station breakdown cards
  - Each station: current best, benchmark comparison, goal, trend chart
  - Color-coded: green (above benchmark), yellow (at benchmark), red (below)
- **Running tab**:
  - Pace trends over time
  - 1km split analysis
  - Volume tracking
- **Benchmarks tab**:
  - Benchmark test history
  - Compare against reference benchmarks by skill level
  - "Time to retest" indicators

### Screen 7: Race Hub
- Route: `/races` (list) and `/races/:id` (detail) and `/races/new` (log new)
- **Primary question**: "How did my race go? How do I compare to my last race?"
- **Race list**: Cards for each logged race, most recent first
- **Race detail view**:
  - Total time, date, location, division
  - Visual split breakdown (horizontal bar chart — each station + run segment)
  - Split-by-split table with times
  - Comparison to previous race (if exists) — delta per split
  - AI analysis CTA → "Ask Coach K to analyze this race"
- **New race form**:
  - Race metadata (date, name, location, division, format)
  - Split entry (per-station and per-run times)
  - Is simulation toggle
  - Notes
- **Pre-race features** (if race_date is set and upcoming):
  - Pacing strategy builder
  - Race day checklist (equipment, nutrition timing, warm-up)

### Screen 8: Profile & Settings
- Route: `/profile` (view/edit) and `/profile/settings` (app settings)
- **Profile section**:
  - Kokonut Pro Form 06 (Edit Profile) as base
  - Physical stats, training history, equipment, injuries
  - Race date and goal management
  - Division selection
- **Settings section**:
  - Units preference (metric/imperial)
  - Theme toggle (Kokonut Switch Button)
  - Notification preferences
  - Data export (download my data as JSON/CSV)
  - Delete account (with confirmation)
- **Achievements section** (could be separate tab or section within profile):
  - Grid of achievement badges
  - Earned: full color + date earned
  - Not earned: grayed out + progress toward unlock

---

## Cross-Cutting Concerns

### Loading States
- **Skeleton screens** for data-heavy pages (dashboard, performance, conversation list)
- **Kokonut AI State Loading** for chat thinking indicator
- **Shimmer/pulse** animation for card placeholders
- **"Coach K is warming up..."** for first-message cold start

### Empty States
Every screen needs an empty state design for first-time users:
- Dashboard with no data → guided "Get Started" cards
- No conversations → "Start your first conversation with Coach K"
- No workouts → "Log your first workout"
- No race results → "Log your first race or ask Coach K for a simulation plan"
- No training plan → "Create a plan or ask Coach K to build one"

### Toast Notifications (sonner)
- Workout saved ✓
- New personal record! 🏆
- Achievement unlocked! 🎉
- Profile updated ✓
- Error: "Something went wrong" with retry
- Coach K unavailable — try again

### Responsive Breakpoints
- Mobile: < 768px (single column, bottom nav, full-screen modals)
- Tablet: 768px - 1023px (two columns where useful, bottom or side nav)
- Desktop: ≥ 1024px (full layouts, side navigation, multi-panel views)

---

## Deliverables

### Deliverable 1: Screen Spec Document
For each of the 9 screens (landing/auth + 8 app screens), provide:
- Component tree (hierarchical, with library source for each component)
- Wireframe description (detailed enough for a developer to build without a Figma file)
- All states (loading, empty, populated, error)
- Data dependencies and API calls
- Interaction map (every button/link and what it triggers)
- Responsive layout description

### Deliverable 2: Component Inventory
A master list of every component that needs to exist in the project:
- Kokonut components to install (with exact CLI commands)
- shadcn/ui components to install (with exact CLI commands)
- Custom components to build (with brief spec for each)
- Shared/reusable components (used across multiple screens)

### Deliverable 3: Route Map
Complete Next.js route structure:
- File-system routes (`app/` directory tree)
- Layout hierarchy (which layouts wrap which routes)
- Route groups for auth vs. app
- Middleware configuration (protected routes)

### Deliverable 4: Animation Spec
Document which Kokonut/Motion animations apply where:
- Page transitions
- Card hover effects
- Chat message appear animations
- Dashboard number counting animations
- Achievement unlock animation
- Workout completion celebration (canvas-confetti)
