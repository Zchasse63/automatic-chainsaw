'use client';

import { useState, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import { Flag, TrendingUp, Target, ChevronRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { useDashboard } from '@/hooks/use-dashboard';
import { useReadiness } from '@/hooks/use-readiness';
import { useDailyMetrics } from '@/hooks/use-daily-metrics';
import { useBenchmarks } from '@/hooks/use-performance';
import { useWorkouts } from '@/hooks/use-workouts';
import { ReadinessScore, StationRadar, ChartTooltip } from '@/components/shared';

// ── Elite station targets (seconds) for score normalization ──
const ELITE_TARGETS: Record<string, number> = {
  'Ski Erg': 210,
  'Sled Push': 70,
  'Sled Pull': 80,
  'Burpee Broad Jump': 150,
  'Row Erg': 200,
  'Farmers Carry': 55,
  'Sandbag Lunges': 110,
  'Wall Balls': 150,
};

// ── Modality color map (matches export exactly) ──
const MODALITY_COLORS: Record<string, string> = {
  run: '#00F0FF',
  running: '#00F0FF',
  strength: '#39FF14',
  hiit: '#FF6B00',
  hyrox: '#39FF14',
  rest: 'rgba(255,255,255,0.1)',
};

// ── Helpers ──
function formatGoalTime(minutes: number | null | undefined): string {
  if (!minutes) return '--:--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:00`;
  return `${m}:00`;
}

function getWeeksAndDays(totalDays: number): { weeks: number; days: number } {
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Defers Date to client to prevent server/client hydration mismatch */
function useClientDate() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);
  return now;
}

// ── Loading skeleton ──
function DashboardSkeleton() {
  return (
    <div className="bg-bg-deep min-h-screen px-6 pt-14 pb-32 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-9 w-56 bg-white/5 rounded-lg" />
          <div className="h-4 w-40 bg-white/5 rounded-lg mt-2" />
        </div>
        <div className="h-24 w-24 bg-white/5 rounded-full" />
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 h-44 bg-white/5 rounded-3xl" />
        <div className="h-48 bg-white/5 rounded-3xl" />
        <div className="h-48 bg-white/5 rounded-3xl" />
        <div className="col-span-2 h-56 bg-white/5 rounded-3xl" />
      </div>
    </div>
  );
}

// ── Stagger animation container ──
const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ── Dashboard Page ──
export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { data: readiness } = useReadiness();
  const { data: metrics } = useDailyMetrics({ limit: 7 });
  const { data: benchmarks } = useBenchmarks('station_time');
  const { data: recentWorkouts } = useWorkouts({ limit: 7 });
  const clientDate = useClientDate();

  if (isLoading || !data) return <DashboardSkeleton />;

  const { profile, daysUntilRace, weeklyStats } = data;
  const race =
    daysUntilRace !== null ? getWeeksAndDays(daysUntilRace) : null;
  const firstName = profile.display_name?.split(' ')[0] ?? 'Athlete';

  // ── Biomarker data from daily_metrics (last 7 days, oldest first) ──
  const biomarkerData = (metrics ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      time: new Date(m.date + 'T00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      hrv: m.hrv_ms ?? 0,
      rhr: m.rhr_bpm ?? 0,
    }));

  // ── Station radar from benchmark_tests ──
  const stationData = (benchmarks ?? [])
    .filter((b) => b.station_name && (b.results as Record<string, number>)?.time_seconds)
    .map((b) => {
      const time = (b.results as Record<string, number>).time_seconds;
      const target = ELITE_TARGETS[b.station_name!] ?? 180;
      const score = Math.round(Math.min(100, (target / time) * 100));
      return { station: b.station_name!, score };
    });

  // ── Weekly training bars from recent workouts (Mon-Sun) ──
  const now = clientDate ?? new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyBars = dayNames.map((day, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];
    const workout = recentWorkouts?.find((w) => w.date === dateStr);
    return {
      day,
      pct: workout
        ? Math.round(Math.min(100, ((workout.duration_minutes ?? 0) / 80) * 100))
        : 0,
      type: workout?.session_type ?? 'rest',
    };
  });

  return (
    <div className="bg-bg-deep min-h-screen px-6 pt-14 pb-32">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* ── Header / Greeting ── */}
        <motion.header variants={fadeUp} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
              {clientDate ? getGreeting(clientDate.getHours()) : ''},{' '}
              <span className="text-[#39FF14]">{firstName}</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {clientDate ? formatDate(clientDate) : '\u00A0'} {profile.current_phase ? `\u00B7 ${profile.current_phase}` : ''}
            </p>
          </div>
          <ReadinessScore score={readiness?.score ?? 0} />
        </motion.header>

        <div className="grid grid-cols-2 gap-4">
          {/* ── Race Countdown Card ── */}
          <motion.div
            variants={fadeUp}
            className="col-span-2 bg-bg-card rounded-3xl p-6 border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#39FF14]/10 rounded-bl-full flex items-center justify-center">
              <Flag className="text-[#39FF14] w-12 h-12" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-[10px] font-bold rounded uppercase tracking-tighter">
                  Race Countdown
                </span>
                {profile.current_phase && (
                  <span className="px-2 py-1 bg-white/5 text-white/40 text-[10px] font-bold rounded uppercase tracking-tighter">
                    {profile.current_phase}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold mb-1">
                {profile.hyrox_division
                  ? `Hyrox ${profile.hyrox_division}`
                  : 'Hyrox Race Day'}
              </h3>
              <p className="text-white/40 text-xs mb-4">
                Target: {formatGoalTime(profile.goal_time_minutes)}
              </p>

              {race !== null ? (
                <div className="flex items-center gap-6">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-3xl font-black italic text-[#39FF14] leading-none">
                        {race.weeks}
                      </p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                        Weeks
                      </p>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div>
                      <p className="text-3xl font-black italic text-white leading-none">
                        {race.days}
                      </p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                        Days
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    {data.activePlan && (
                      <>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#39FF14] rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${data.activePlan.progressPct}%`,
                            }}
                            transition={{
                              duration: 1.2,
                              ease: 'easeOut',
                              delay: 0.3,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-white/40 mt-1 uppercase">
                          Training Block: {data.activePlan.progressPct}% Complete
                        </p>
                      </>
                    )}
                  </div>
                  <a
                    href="/coach"
                    className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 active:scale-95 transition-transform flex-shrink-0"
                  >
                    PLAN <ChevronRight size={14} />
                  </a>
                </div>
              ) : (
                <p className="text-white/30 text-sm">
                  No race date set. Visit your profile to add one.
                </p>
              )}
            </div>
          </motion.div>

          {/* ── Biomarker Chart Card ── */}
          <motion.div
            variants={fadeUp}
            className="bg-bg-card rounded-3xl p-5 border border-white/5 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-[#00F0FF] w-5 h-5" />
              <span className="text-[10px] text-white/40 font-bold uppercase">
                HRV / RHR
              </span>
            </div>

            {biomarkerData.length > 0 ? (
              <>
                <div className="h-20 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={biomarkerData}>
                      <Tooltip
                        content={
                          <ChartTooltip unitMap={{ hrv: 'ms', rhr: 'bpm' }} />
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="hrv"
                        stroke="#39FF14"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="rhr"
                        stroke="#00F0FF"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-between">
                  <div>
                    <p className="text-[8px] text-white/40 uppercase">
                      Current HRV
                    </p>
                    <p className="text-lg font-bold">
                      {biomarkerData[biomarkerData.length - 1]?.hrv ?? '--'}ms
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-white/40 uppercase">
                      Resting HR
                    </p>
                    <p className="text-lg font-bold text-[#00F0FF]">
                      {biomarkerData[biomarkerData.length - 1]?.rhr ?? '--'} bpm
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-[100px]">
                <p className="text-white/20 text-xs text-center uppercase tracking-wider">
                  No biomarker data
                </p>
              </div>
            )}
          </motion.div>

          {/* ── Station Profile Radar Card ── */}
          <motion.div
            variants={fadeUp}
            className="bg-bg-card rounded-3xl p-5 border border-white/5 flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <Target className="text-[#39FF14] w-5 h-5" />
              <span className="text-[10px] text-white/40 font-bold uppercase">
                Station Profile
              </span>
            </div>

            {stationData.length > 0 ? (
              <>
                <div className="flex-1 flex items-center justify-center">
                  <StationRadar
                    data={stationData}
                    height={100}
                    outerRadius="55%"
                    showDots={false}
                    fillOpacity={0.12}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <div>
                    <p className="text-[8px] text-white/40 uppercase">
                      Strongest
                    </p>
                    <p className="text-xs font-bold text-[#39FF14]">
                      {stationData.reduce((best, s) =>
                        s.score > best.score ? s : best
                      ).station}{' '}
                      {stationData.reduce((best, s) =>
                        s.score > best.score ? s : best
                      ).score}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-white/40 uppercase">Focus</p>
                    <p className="text-xs font-bold text-white/60">
                      {stationData.reduce((worst, s) =>
                        s.score < worst.score ? s : worst
                      ).station}{' '}
                      {stationData.reduce((worst, s) =>
                        s.score < worst.score ? s : worst
                      ).score}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-[100px]">
                <p className="text-white/20 text-xs text-center uppercase tracking-wider">
                  No station data
                </p>
              </div>
            )}
          </motion.div>

          {/* ── Weekly Training Load Card ── */}
          <motion.div
            variants={fadeUp}
            className="col-span-2 bg-gradient-to-br from-[#1a1a1a] to-[#222] rounded-3xl p-6 border border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Weekly Training Load</h3>
              <div className="flex items-center gap-3">
                {[
                  { label: 'Run', color: '#00F0FF' },
                  { label: 'HIIT', color: '#FF6B00' },
                  { label: 'Strength', color: '#39FF14' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="text-[8px] text-white/40 uppercase">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {weeklyBars.length > 0 ? (
              <>
                <div className="flex gap-1.5 items-end">
                  {weeklyBars.map(({ day, pct, type }, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div className="w-full h-14 bg-white/5 rounded-full overflow-hidden flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          transition={{
                            duration: 0.8,
                            delay: i * 0.1,
                            ease: 'easeOut',
                          }}
                          className="w-full rounded-full"
                          style={{
                            backgroundColor:
                              MODALITY_COLORS[type] ?? 'rgba(255,255,255,0.1)',
                          }}
                        />
                      </div>
                      <span className="text-[8px] text-white/40">{day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">
                      This Week
                    </p>
                    <div className="flex gap-4 mt-1">
                      <div>
                        <p className="text-[9px] text-white/30 uppercase">
                          Sessions
                        </p>
                        <p className="text-lg font-black italic">
                          {weeklyStats.workouts}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/30 uppercase">
                          Minutes
                        </p>
                        <p className="text-lg font-black italic text-[#00F0FF]">
                          {weeklyStats.totalMinutes}
                        </p>
                      </div>
                    </div>
                  </div>
                  {weeklyStats.avgRpe !== null && (
                    <div className="text-right">
                      <p className="text-[9px] text-white/30 uppercase">
                        Avg RPE
                      </p>
                      <p className="text-3xl font-black italic text-white leading-none">
                        {weeklyStats.avgRpe.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                        Intensity
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[120px] gap-2">
                <p className="text-white/20 text-xs text-center uppercase tracking-wider">
                  No training data this week
                </p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <p className="text-[9px] text-white/30 uppercase">
                      Sessions
                    </p>
                    <p className="text-lg font-black italic">
                      {weeklyStats.workouts}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/30 uppercase">
                      Minutes
                    </p>
                    <p className="text-lg font-black italic text-[#00F0FF]">
                      {weeklyStats.totalMinutes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
