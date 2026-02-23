'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Zap, BarChart2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/hooks/use-dashboard';
import { useBenchmarks } from '@/hooks/use-performance';
import { useWorkouts } from '@/hooks/use-workouts';
import { StationRadar } from '@/components/shared/station-radar';
import { Sparkline } from '@/components/shared/sparkline';
import { InsightBlock } from '@/components/shared/insight-block';
import { EmptyState } from '@/components/shared/empty-state';

// ── Elite station targets (seconds) ──
const ELITE_TARGETS: Record<string, number> = {
  'Ski Erg': 210, 'Sled Push': 70, 'Sled Pull': 80,
  'Burpee Broad Jump': 150, 'Row Erg': 200,
  'Farmers Carry': 55, 'Sandbag Lunges': 110, 'Wall Balls': 150,
};

const MODALITY_COLORS: Record<string, string> = {
  running: '#00F0FF', hiit: '#FF6B00', strength: '#B45FFF',
  hyrox_sim: '#39FF14', crossfit: '#FF8C42',
};

// ── Types ────────────────────────────────────────────────────────────────────

interface ModalityBreakdown {
  name: string;
  pct: number;
  color: string;
}

interface RadarDataPoint {
  group: string;
  A: number;
}

interface ExerciseVolume {
  name: string;
  muscle: string;
  volume: number;
  sets: number;
  spark: number[];
}

interface StationReadiness {
  station: string;
  pct: number;
  color: string;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function heatColor(v: number): string {
  if (v === 0) return 'bg-white/5';
  if (v < 0.3) return 'bg-[#39FF14]/10';
  if (v < 0.6) return 'bg-[#39FF14]/30';
  if (v < 0.85) return 'bg-[#39FF14]/60';
  return 'bg-[#39FF14]';
}

const heatmapRPE = ['RPE 10', 'RPE 9', 'RPE 8', 'RPE 7', 'RPE 6'];
const heatmapDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function PerformanceSkeleton() {
  return (
    <div className="min-h-screen bg-bg-deep px-5 pt-14 pb-32 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="w-10 h-10 bg-white/5 rounded-full" />
        <div className="text-center">
          <div className="h-3 w-24 bg-white/5 rounded mx-auto mb-2" />
          <div className="h-5 w-40 bg-white/5 rounded mx-auto" />
        </div>
        <div className="w-10 h-10 bg-white/5 rounded-full" />
      </div>
      <div className="bg-bg-card-alt rounded-3xl h-56 mb-5" />
      <div className="bg-bg-card-alt rounded-3xl h-40 mb-5" />
      <div className="bg-bg-card-alt rounded-3xl h-48 mb-5" />
      <div className="bg-bg-card-alt rounded-3xl h-64 mb-5" />
      <div className="bg-bg-card-alt rounded-3xl h-48 mb-5" />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PerformancePage() {
  const router = useRouter();
  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: benchmarks, isLoading: benchmarksLoading } = useBenchmarks('station_time');
  const { data: allWorkouts, isLoading: workoutsLoading } = useWorkouts({ limit: 50 });
  const [activeTab, setActiveTab] = useState<'bars' | 'radar'>('bars');
  const [visibleExercises, setVisibleExercises] = useState(0);

  const isLoading = dashLoading || benchmarksLoading || workoutsLoading;

  // Derive data from hooks
  const weeklyStats = dashboard?.weeklyStats;
  const daysUntilRace = dashboard?.daysUntilRace;
  const profile = dashboard?.profile;

  // ── This week's workouts ──
  const { thisWeekWorkouts, weekDateRange } = useMemo(() => {
    const now = new Date();
    const dow = now.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const monStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sunStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const filtered = (allWorkouts ?? []).filter((w) => {
      const d = new Date(w.date + 'T00:00');
      return d >= monday && d <= sunday;
    });
    return { thisWeekWorkouts: filtered, weekDateRange: `${monStr} – ${sunStr}` };
  }, [allWorkouts]);

  // ── Volume hero stats ──
  const totalVolumeKg = thisWeekWorkouts.reduce((s, w) => s + (w.total_volume_kg ?? 0), 0);
  const totalVolumeLbs = totalVolumeKg > 0 ? Math.round(totalVolumeKg * 2.205) : null;
  const runningKm = thisWeekWorkouts.reduce((s, w) => s + (w.total_distance_km ?? 0), 0) || null;
  const volumeChangePct = null as number | null; // Would need previous week data

  // ── Per-day volume bars (Mon-Sun) ──
  const weekBars: number[] = useMemo(() => {
    const maxDur = Math.max(...thisWeekWorkouts.map((w) => w.duration_minutes ?? 0), 1);
    const now = new Date();
    const dow = now.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      const w = thisWeekWorkouts.find((wk) => wk.date === dateStr);
      return w ? Math.round(((w.duration_minutes ?? 0) / maxDur) * 100) : 0;
    });
  }, [thisWeekWorkouts]);

  // ── Modality breakdown ──
  const modalityBreakdown: ModalityBreakdown[] = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    (allWorkouts ?? []).forEach((w) => {
      typeCounts[w.session_type] = (typeCounts[w.session_type] ?? 0) + 1;
    });
    const total = Object.values(typeCounts).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(typeCounts)
      .map(([name, count]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        pct: Math.round((count / total) * 100),
        color: MODALITY_COLORS[name] ?? '#39FF14',
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [allWorkouts]);

  // ── Radar data (from modality) ──
  const radarData: RadarDataPoint[] = modalityBreakdown.map((m) => ({
    group: m.name,
    A: m.pct,
  }));

  // ── RPE Heatmap (5 rows x 7 cols: RPE 10→6, Mon→Sun) ──
  const heatmapGrid: number[][] = useMemo(() => {
    const grid = Array.from({ length: 5 }, () => Array(7).fill(0));
    thisWeekWorkouts.forEach((w) => {
      if (!w.rpe_post) return;
      const d = new Date(w.date + 'T00:00');
      const dow = (d.getDay() + 6) % 7; // Mon=0, Sun=6
      const rpeRow = Math.min(4, Math.max(0, 10 - Math.round(w.rpe_post)));
      grid[rpeRow][dow] = Math.min(1, grid[rpeRow][dow] + 0.5);
    });
    return grid;
  }, [thisWeekWorkouts]);

  // ── Exercise volume (from workout sets concept — simplified from workout data) ──
  const exercises: ExerciseVolume[] = useMemo(() => {
    if (!allWorkouts?.length) return [];
    const typeVolumes: Record<string, { total: number; count: number; sparks: number[] }> = {};
    allWorkouts.forEach((w) => {
      const key = w.session_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (!typeVolumes[key]) typeVolumes[key] = { total: 0, count: 0, sparks: [] };
      const vol = (w.total_volume_kg ?? 0) * 2.205;
      typeVolumes[key].total += vol > 0 ? vol : (w.duration_minutes ?? 0) * 10;
      typeVolumes[key].count += 1;
      typeVolumes[key].sparks.push(vol > 0 ? vol : (w.duration_minutes ?? 0) * 10);
    });
    return Object.entries(typeVolumes)
      .map(([name, data]) => ({
        name,
        muscle: name,
        volume: Math.round(data.total),
        sets: data.count,
        spark: data.sparks.slice(-7),
      }))
      .sort((a, b) => b.volume - a.volume);
  }, [allWorkouts]);

  // ── Station readiness from benchmarks ──
  const stationReadiness: StationReadiness[] = useMemo(() => {
    if (!benchmarks?.length) return [];
    return benchmarks
      .filter((b) => b.station_name && (b.results as Record<string, number>)?.time_seconds)
      .map((b) => {
        const name = b.station_name!;
        const time = (b.results as Record<string, number>).time_seconds;
        const target = ELITE_TARGETS[name] ?? 180;
        const pct = Math.round(Math.min(100, (target / time) * 100));
        const color = pct >= 80 ? '#39FF14' : pct >= 60 ? '#FFB800' : '#FF4444';
        return { station: name, pct, color };
      });
  }, [benchmarks]);

  // Stagger-reveal exercises
  useEffect(() => {
    if (exercises.length === 0) return;
    let count = 0;
    const id = setInterval(() => {
      count++;
      setVisibleExercises(count);
      if (count >= exercises.length) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [exercises.length]);

  if (isLoading) return <PerformanceSkeleton />;

  const weeksOut = daysUntilRace ? Math.floor(daysUntilRace / 7) : null;

  return (
    <div className="min-h-screen bg-bg-deep text-white font-sans select-none">
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 pt-14 pb-4 border-b border-white/5 relative z-10">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </motion.button>

        <div className="text-center">
          <p className="text-[10px] text-[#39FF14] font-black uppercase tracking-[0.25em]">
            Analytics
          </p>
          <h1 className="text-lg font-black italic uppercase tracking-tighter leading-none text-white">
            Weekly Performance
          </h1>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center">
          <BarChart2 size={16} className="text-[#39FF14]" />
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="overflow-y-auto pb-32 px-5 pt-5 space-y-5">
        {/* ── Hero: Total Volume + Race Countdown ── */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-bg-card-alt rounded-3xl p-6 border border-[#39FF14]/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(57,255,20,0.07),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,240,255,0.05),transparent_70%)]" />

          {/* Race badge */}
          <div className="flex items-center gap-2 mb-3">
            {profile?.race_date && (
              <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-[9px] font-black rounded uppercase tracking-widest">
                Race Day{' '}
                {new Date(profile.race_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
            {weeksOut !== null && (
              <span className="px-2 py-1 bg-white/5 text-white/40 text-[9px] font-black rounded uppercase tracking-widest">
                {weeksOut} Weeks Out
              </span>
            )}
          </div>

          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] mb-1">
            {weekDateRange ?? 'This Week'} · Total Load
          </p>

          {totalVolumeLbs !== null ? (
            <div className="flex items-end justify-between">
              <div>
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
                  className="text-6xl font-black italic tracking-tighter leading-none text-white"
                >
                  {totalVolumeLbs.toLocaleString()}
                  <span className="text-xl text-white/30 not-italic ml-2">
                    LBS
                  </span>
                </motion.p>
                {runningKm !== null && (
                  <p className="text-[10px] text-[#39FF14] font-bold mt-1">
                    + {runningKm} km running volume
                  </p>
                )}
              </div>

              {volumeChangePct !== null && (
                <div className="text-right pb-1">
                  <div className="flex items-center gap-1 justify-end">
                    {volumeChangePct >= 0 ? (
                      <TrendingUp size={15} className="text-[#39FF14]" />
                    ) : (
                      <TrendingDown size={15} className="text-[#FF4444]" />
                    )}
                    <span
                      className={`text-2xl font-black italic ${
                        volumeChangePct >= 0
                          ? 'text-[#39FF14]'
                          : 'text-[#FF4444]'
                      }`}
                    >
                      {volumeChangePct >= 0 ? '+' : ''}
                      {volumeChangePct.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[9px] text-white/30 uppercase font-bold mt-0.5">
                    vs last week
                  </p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState label="No volume data yet" />
          )}

          {/* Mini bar chart */}
          {weekBars.length > 0 && (
            <>
              <div className="mt-5 flex items-end gap-1.5 h-10">
                {weekBars.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-end h-full"
                  >
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{
                        delay: 0.35 + i * 0.07,
                        duration: 0.35,
                        ease: 'easeOut',
                      }}
                      style={{
                        transformOrigin: 'bottom',
                        height: `${h || 4}%`,
                      }}
                      className={`w-full rounded-sm ${
                        i === weekBars.length - 1
                          ? 'bg-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.6)]'
                          : 'bg-[#39FF14]/30'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-1">
                {heatmapDays.map((d, i) => (
                  <span
                    key={i}
                    className="flex-1 text-center text-[8px] text-white/25 font-bold"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            {[
              {
                label: 'Sessions',
                val: weeklyStats?.workouts?.toString() ?? '--',
                sub: 'this week',
              },
              {
                label: 'Avg Intensity',
                val: weeklyStats?.avgRpe
                  ? `RPE ${weeklyStats.avgRpe.toFixed(1)}`
                  : '--',
                sub: 'avg RPE',
              },
              {
                label: 'Total Min',
                val: weeklyStats?.totalMinutes?.toString() ?? '--',
                sub: 'this week',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/5 rounded-2xl p-3 text-center border border-white/5"
              >
                <p className="text-[8px] text-white/30 uppercase font-bold tracking-wider">
                  {s.label}
                </p>
                <p className="text-sm font-black italic mt-0.5">{s.val}</p>
                <p className="text-[8px] text-white/25 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── AI Insights ── */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={12} className="text-[#39FF14]" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
              Coach Insights
            </p>
          </div>
          <div className="space-y-3">
            {/* TODO: Replace with AI-generated insights from useCoachInsights() hook */}
            <InsightBlock
              icon={<TrendingUp size={13} />}
              title="Coming Soon"
              body="Complete more workouts to unlock personalized performance insights powered by your AI coach."
              accent="green"
            />
          </div>
        </motion.section>

        {/* ── Training Modality Breakdown ── */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="bg-bg-card-alt rounded-3xl p-5 border border-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-tighter text-white">
              Training Modality Breakdown
            </h2>
            <div className="bg-white/5 rounded-full p-0.5 flex">
              {(['bars', 'radar'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all duration-200 ${
                    activeTab === t
                      ? 'bg-[#39FF14] text-black'
                      : 'text-white/40'
                  }`}
                >
                  {t === 'bars' ? 'Bars' : 'Radar'}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'bars' ? (
              <motion.div
                key="bars"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                {modalityBreakdown.length > 0 ? (
                  modalityBreakdown.map((mg, idx) => (
                    <div key={mg.name}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white/80">
                          {mg.name}
                        </span>
                        <span
                          className="text-xs font-black"
                          style={{ color: mg.color }}
                        >
                          {mg.pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${mg.pct}%` }}
                          transition={{
                            delay: 0.1 * idx + 0.25,
                            duration: 0.55,
                            ease: 'easeOut',
                          }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: mg.color }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState label="No modality data yet" />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="radar"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                className="h-52"
              >
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={radarData}
                      cx="50%"
                      cy="50%"
                      outerRadius="68%"
                    >
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis
                        dataKey="group"
                        tick={{
                          fill: 'rgba(255,255,255,0.4)',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      />
                      <Radar
                        name="Performance %"
                        dataKey="A"
                        stroke="#39FF14"
                        fill="#39FF14"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState label="No radar data yet" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── Intensity Heatmap ── */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5 }}
          className="bg-bg-card-alt rounded-3xl p-5 border border-white/5"
        >
          <h2 className="text-sm font-black uppercase tracking-tighter text-white mb-0.5">
            Intensity Distribution
          </h2>
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider mb-4">
            RPE Heatmap · This Week
          </p>

          {heatmapGrid.length > 0 ? (
            <>
              <div className="flex gap-3">
                {/* RPE y-axis */}
                <div className="flex flex-col justify-between py-0.5">
                  {heatmapRPE.map((r) => (
                    <span
                      key={r}
                      className="text-[8px] text-white/30 font-bold uppercase leading-none w-10 text-right"
                    >
                      {r}
                    </span>
                  ))}
                </div>

                {/* Grid */}
                <div className="flex-1 flex flex-col gap-1.5">
                  {heatmapGrid.map((row, ri) => (
                    <div key={ri} className="flex gap-1.5">
                      {row.map((val, ci) => (
                        <motion.div
                          key={ci}
                          initial={{ opacity: 0, scale: 0.4 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 0.45 + (ri * 7 + ci) * 0.014,
                            duration: 0.18,
                          }}
                          className={`flex-1 rounded-sm ${heatColor(val)} ${
                            val >= 0.85
                              ? 'shadow-[0_0_6px_rgba(57,255,20,0.55)]'
                              : ''
                          }`}
                          style={{ aspectRatio: '1/1' }}
                        />
                      ))}
                    </div>
                  ))}
                  {/* x-axis labels */}
                  <div className="flex gap-1.5 mt-0.5">
                    {heatmapDays.map((d, i) => (
                      <span
                        key={i}
                        className="flex-1 text-center text-[8px] text-white/25 font-bold"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-1.5 mt-4 justify-end">
                <span className="text-[8px] text-white/30 uppercase font-bold mr-1">
                  Low
                </span>
                {[0.05, 0.2, 0.45, 0.65, 0.85, 1].map((v, i) => (
                  <div key={i} className={`w-4 h-2 rounded-sm ${heatColor(v)}`} />
                ))}
                <span className="text-[8px] text-white/30 uppercase font-bold ml-1">
                  Max
                </span>
              </div>
            </>
          ) : (
            <EmptyState label="No RPE data yet" />
          )}
        </motion.section>

        {/* ── Movement Volume ── */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.5 }}
          className="bg-bg-card-alt rounded-3xl p-5 border border-white/5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-tighter text-white">
              Movement Volume
            </h2>
            <span className="text-[10px] text-white/30 font-bold uppercase">
              {exercises.length > 0
                ? `${exercises.length} Movements`
                : 'No data'}
            </span>
          </div>

          {exercises.length > 0 ? (
            <div className="space-y-2">
              {exercises.slice(0, visibleExercises).map((ex, idx) => (
                <motion.div
                  key={ex.name}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28 }}
                  className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  <span className="text-[10px] font-black text-white/20 w-4 text-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white leading-none truncate">
                      {ex.name}
                    </p>
                    <p className="text-[9px] text-white/30 font-bold uppercase mt-0.5">
                      {ex.muscle} · {ex.sets} sets
                    </p>
                  </div>
                  <Sparkline data={ex.spark} />
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black italic text-white leading-none">
                      {(ex.volume / 1000).toFixed(1)}
                      <span className="text-[9px] text-white/30 not-italic ml-0.5">
                        k LBS
                      </span>
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState label="No movement data yet" />
          )}
        </motion.section>

        {/* ── Race Station Readiness ── */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.5 }}
          className="bg-bg-card-alt rounded-3xl p-5 border border-white/5"
        >
          <h2 className="text-sm font-black uppercase tracking-tighter text-white mb-1">
            Race Station Readiness
          </h2>
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider mb-4">
            8 Hyrox Stations · Estimated Readiness
          </p>

          {stationReadiness.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {stationReadiness.map((s, idx) => (
                <motion.div
                  key={s.station}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="bg-white/[0.03] rounded-2xl p-3 border border-white/5"
                >
                  <p className="text-[9px] text-white/50 font-bold uppercase leading-none mb-1.5">
                    {s.station}
                  </p>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.pct}%` }}
                      transition={{
                        delay: 0.55 + idx * 0.05,
                        duration: 0.5,
                        ease: 'easeOut',
                      }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                  </div>
                  <p
                    className="text-xs font-black"
                    style={{ color: s.color }}
                  >
                    {s.pct}%
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState label="No station readiness data yet" />
          )}
        </motion.section>

        {/* ── Recovery Forecast ── */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.5 }}
          className="bg-gradient-to-br from-[#111] to-[#0d0d0d] rounded-3xl p-5 border border-[#00F0FF]/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#00F0FF]/20 flex items-center justify-center">
              <Zap size={12} className="text-[#00F0FF]" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00F0FF]">
              Recovery Forecast
            </p>
          </div>
          {/* TODO: Replace with actual recovery forecast from useRecoveryForecast() hook */}
          <p className="text-xs text-white/60 leading-relaxed mb-4">
            Complete more workouts to unlock AI-powered recovery forecasting.
            Your recovery forecast will include HRV trends, optimal next session
            timing, and taper recommendations.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <p className="text-[8px] text-white/30 uppercase font-bold tracking-wider">
                Overreaching Risk
              </p>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-xl font-black italic text-white/30">
                  --
                </span>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
              <p className="text-[8px] text-white/30 uppercase font-bold tracking-wider">
                Taper Starts In
              </p>
              <p className="text-xl font-black italic text-white/30 mt-1">
                {weeksOut !== null && weeksOut > 6
                  ? `${weeksOut - 6} Weeks`
                  : '--'}
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
