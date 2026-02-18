# Calendar Enhancement Specification

> Full-page calendar experience merging training plan days + workout logs.
> Approved by user on 2026-02-18.

---

## Current State

### MonthCalendar (`src/components/training/month-calendar.tsx` — 92 lines)
- Basic `react-day-picker` DayPicker with `mode="single"`
- Fixed 40px × 40px day cells — very compact
- Shows colored dots (up to 3) for **logged workouts only**
- Groups workouts by date, renders dots by session type
- **No click handling**, no day expansion, no detail view
- **Does NOT show training plan days** — only workout logs
- Session type colors: run=blue, hiit=orange, strength=purple, simulation=yellow, recovery=emerald, station_practice=pink

### WeekCalendar (`src/components/training/week-calendar.tsx` — 202 lines)
- Shows one plan week at a time with `@dnd-kit` drag-and-drop
- 7 columns, small cards per day showing session type + title
- Click opens bottom drawer with workout details + "Start Workout" / "Mark Done"
- **Only shows plan days** — ignores logged workouts
- Navigates by plan week number

### Training Page (`src/app/(app)/training/page.tsx`)
- Toggles between WeekCalendar and MonthCalendar
- Neither view merges plan + workout data
- MonthCalendar is essentially decorative

### No `/calendar` route exists.

---

## Implementation Plan

### New Route: `/calendar`

Create `src/app/(app)/calendar/page.tsx` — a full-page calendar experience.

### Architecture: 6 New Files + 1 Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/app/(app)/calendar/page.tsx` | NEW | Page route — data fetching, state, layout |
| `src/components/calendar/full-calendar.tsx` | NEW | Month grid with merged data |
| `src/components/calendar/calendar-week-view.tsx` | NEW | Week strip with taller detail cells |
| `src/components/calendar/calendar-day-detail.tsx` | NEW | Day expansion panel (drawer on mobile, side panel on desktop) |
| `src/components/calendar/calendar-day-cell.tsx` | NEW | Individual day cell with merged indicators |
| `src/lib/calendar-utils.ts` | NEW | Date math: map plan week_number + day_of_week → calendar dates |
| `src/app/(app)/training/page.tsx` | MODIFY | Add "View Full Calendar" link to `/calendar` |

### Data Sources & Hooks

Use these EXISTING hooks (do NOT create new API routes):
- `useWorkouts({ from, to, limit: 50 })` — fetches logged workouts for a date range
- `useActiveTrainingPlan()` — gets the active plan (id, plan_name, goal, start_date, duration_weeks)
- `useTrainingPlan(id)` — gets full plan detail including `training_plan_weeks[].training_plan_days[]`
- `useUpdatePlanDay()` — for "Mark Complete" action

### calendar-utils.ts — Date Mapping Logic

The key utility: convert `plan.start_date` + `week.week_number` + `day.day_of_week` into actual calendar dates.

```typescript
// day_of_week is 0=Monday through 6=Sunday
// week_number is 1-indexed
// start_date is ISO string (the plan's start date, should be a Monday)
export function planDayToDate(startDate: string, weekNumber: number, dayOfWeek: number): Date {
  const start = new Date(startDate);
  const dayOffset = (weekNumber - 1) * 7 + dayOfWeek;
  const date = new Date(start);
  date.setDate(start.getDate() + dayOffset);
  return date;
}

// Build a map of ISO date string → PlanDay for quick lookup
export function buildPlanDayMap(startDate: string, weeks: PlanWeek[]): Map<string, PlanDay> { ... }

// Build a map of ISO date string → Workout[] for quick lookup
export function buildWorkoutMap(workouts: Workout[]): Map<string, Workout[]> { ... }
```

### Page Component (`calendar/page.tsx`)

```
'use client'

State:
- currentMonth (Date) — for month navigation
- calendarView ('month' | 'week') — toggle
- selectedDate (string | null) — which day is expanded
- selectedWeekStart (Date) — for week view navigation

Data fetching:
- useWorkouts({ from: firstOfMonth, to: lastOfMonth })
- useActiveTrainingPlan()
- useTrainingPlan(activePlan?.id)

Layout:
- Full page, no card wrapper
- Header: "Calendar" title + view toggle (month/week) + "View Full Calendar" link back
- Month/week grid fills remaining space
- Detail panel: Drawer on mobile, side panel on desktop
```

### Month View (`full-calendar.tsx`)

- Standard 7-column calendar grid (Sun–Sat or Mon–Sun, use Mon–Sun to match WeekCalendar)
- **Larger cells**: responsive, minimum ~80px wide, grow to fill width
- Each cell renders `<CalendarDayCell>` with merged data
- Gray out days from prev/next month
- Today highlighted with yellow border/ring
- Week focus banner: if a plan is active, show the week's focus text above/across each plan week's rows
- Month navigation: prev/next arrows in the header

### Week View (`calendar-week-view.tsx`)

- Horizontal 7-day strip with **taller cells** showing more detail
- Full workout title, description preview (2 lines), duration, session type badge, completion status
- Week navigation: prev/next week arrows
- Shows the plan week number + focus if applicable

### Day Cell (`calendar-day-cell.tsx`)

Each cell shows the merged state of plan + workout for that date:

```
Props:
- date: Date
- planDay: PlanDay | null (from the plan map)
- workouts: Workout[] (from the workout map)
- isToday: boolean
- isCurrentMonth: boolean
- onClick: () => void

Renders:
- Date number (bold + yellow if today)
- Session type pill (e.g., "RUN", "HIIT") — from planDay.session_type or workout.session_type
- Duration (planDay.estimated_duration_minutes or workout.duration_minutes)
- Completion indicator:
  - ✓ green check if planDay.is_completed or workout exists for a planned day
  - No indicator if planned but not done
  - Small "+" indicator if unplanned workout logged (no plan day for that date)
- Rest day: muted "Rest" label
- Empty: no indicators
```

### Day Detail Panel (`calendar-day-detail.tsx`)

Clicking any day cell opens this panel.

**Mobile**: Use the existing `Drawer` component from `@/components/ui/drawer`
**Desktop**: Use a right-side sliding panel (absolute positioned, calendar compresses)

Content sections:

1. **Date header**: Full date (e.g., "Monday, March 2, 2026"), plan week info if applicable
2. **Planned Session** (if planDay exists):
   - Session type badge
   - Workout title
   - Full workout description (whitespace-pre-wrap)
   - Estimated duration
   - Completion status
3. **Logged Workout** (if workout exists):
   - Session type + duration
   - RPE (if recorded)
   - Notes (if any)
   - Completion status
4. **Actions**:
   - "Start Workout" → navigates to `/training/workout/{planDay.id}` (only if planDay exists and not completed)
   - "Mark Complete" → calls `useUpdatePlanDay` mutation (only if planDay exists and not completed)
   - "Log Workout" → navigates to `/coach?context=log&new=true`
   - "Ask Coach K" → navigates to `/coach?context=plan&date=...`

### Training Page Modification

Add a "View Full Calendar" button/link next to the existing week/month toggle:

```tsx
<Link href="/calendar" className="...">
  <CalendarDays className="h-4 w-4 mr-1" />
  Full Calendar
</Link>
```

This should be placed near the calendar view toggle buttons (around line 155 of training/page.tsx).

---

## Design System Compliance

Use ONLY existing design tokens and patterns from the codebase:

- **Backgrounds**: `bg-surface-0` (page), `bg-surface-1` (cards), `bg-surface-2` (badges)
- **Text**: `text-text-primary`, `text-text-secondary`, `text-text-tertiary`
- **Borders**: `border-border-default`
- **Accent**: `bg-hyrox-yellow`, `text-hyrox-yellow`, `hover:bg-hyrox-yellow-hover`
- **Typography**: `font-display` (headings, labels, uppercase), `font-body` (content), `font-mono` (data)
- **Session type colors**: Match `SESSION_TYPE_COLORS` from `week-calendar.tsx`:
  - run: `bg-station-ski`, hiit: `bg-station-push`, strength: `bg-station-carry`
  - simulation: `bg-hyrox-yellow`, recovery: `bg-coach-green`, station_practice: `bg-station-burpee`
- **Components**: Use existing shadcn/ui components (Button, Drawer, DrawerContent, DrawerHeader, DrawerTitle)
- **Icons**: Use `lucide-react` icons only

---

## What This Does NOT Include

- No drag-and-drop (stays on Training page WeekCalendar)
- No plan editing (calendar is read-only + actions)
- No nav bar changes (5 items stay, calendar accessed from Training page)
- No new API routes (all data available via existing hooks)
- No workout creation from calendar (use existing Log Workout flow)

---

## Success Criteria

1. `/calendar` route renders a full-page month calendar
2. Day cells merge plan days + logged workouts visually
3. Clicking any day opens detail panel with full workout info
4. "Start Workout", "Mark Complete" actions work from detail panel
5. Month/week navigation works correctly
6. Plan week focus banners display when a plan is active
7. Today is highlighted
8. Responsive: works on mobile (375px) and desktop (1280px+)
9. Design matches existing B0 design system exactly
10. `bun run build` passes with no errors
11. "View Full Calendar" link added to Training page
