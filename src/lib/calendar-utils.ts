// day_of_week: 0=Monday through 6=Sunday
// week_number: 1-indexed
// start_date: ISO string (plan's start date, should be a Monday)

interface PlanDay {
  id: string;
  day_of_week: number;
  session_type: string | null;
  workout_title: string | null;
  workout_description: string | null;
  estimated_duration_minutes: number | null;
  is_rest_day: boolean | null;
  is_completed: boolean | null;
  linked_workout_log_id?: string | null;
  notes?: string | null;
}

interface PlanWeek {
  id: string;
  week_number: number;
  focus: string | null;
  training_plan_days: PlanDay[];
}

interface Workout {
  id: string;
  date: string;
  session_type: string;
  duration_minutes: number | null;
  rpe_post: number | null;
  notes: string | null;
}

export function planDayToDate(
  startDate: string,
  weekNumber: number,
  dayOfWeek: number
): Date {
  // Append T00:00 to force local-time parsing — "YYYY-MM-DD" alone
  // is parsed as UTC midnight, which shifts the date in US timezones.
  const start = new Date(startDate + 'T00:00');
  const dayOffset = (weekNumber - 1) * 7 + dayOfWeek;
  const date = new Date(start);
  date.setDate(start.getDate() + dayOffset);
  return date;
}

export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildPlanDayMap(
  startDate: string | null,
  weeks: PlanWeek[]
): Map<string, PlanDay> {
  const map = new Map<string, PlanDay>();
  if (!startDate) return map;
  for (const week of weeks) {
    for (const day of week.training_plan_days) {
      const date = planDayToDate(startDate, week.week_number, day.day_of_week);
      map.set(toISODateString(date), day);
    }
  }
  return map;
}

export function buildWorkoutMap(workouts: Workout[]): Map<string, Workout[]> {
  const map = new Map<string, Workout[]>();
  for (const w of workouts) {
    const key = w.date.slice(0, 10); // ISO date string YYYY-MM-DD
    const existing = map.get(key) ?? [];
    existing.push(w);
    map.set(key, existing);
  }
  return map;
}

// Returns all dates to display in a month grid (6 weeks = 42 cells)
// Starts from the Monday on or before the 1st of the month
export function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  // JS getDay(): 0=Sun, 1=Mon... We want 0=Mon
  const jsDay = firstDay.getDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() + mondayOffset);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

// Returns 7 days starting from the given date (Monday)
export function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
}

// Returns the Monday of the current week
export function getCurrentWeekStart(): Date {
  const today = new Date();
  const jsDay = today.getDay(); // 0=Sun
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
