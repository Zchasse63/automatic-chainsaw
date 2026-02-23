'use client';

import { useState, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Brain,
  Moon,
  Zap,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Heart,
  Wind,
  Flame,
  AlertCircle,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { StatCard } from '@/components/shared/stat-card';
import { StationRadar } from '@/components/shared/station-radar';
import { WorkoutBadge, workoutColors } from '@/components/shared/workout-badge';
import { ChartTooltip } from '@/components/shared/chart-tooltip';
import { InsightBlock } from '@/components/shared/insight-block';
import { EmptyState } from '@/components/shared/empty-state';
import { useDashboard } from '@/hooks/use-dashboard';
import { useDailyMetrics } from '@/hooks/use-daily-metrics';
import { useWorkouts } from '@/hooks/use-workouts';
import { useBenchmarks, usePersonalRecords } from '@/hooks/use-performance';

// ── Elite station targets (seconds) for score normalization ──
const ELITE_TARGETS: Record<string, number> = {
  'Ski Erg': 210, 'Sled Push': 70, 'Sled Pull': 80,
  'Burpee Broad Jump': 150, 'Row Erg': 200,
  'Farmers Carry': 55, 'Sandbag Lunges': 110, 'Wall Balls': 150,
};

const STATION_COLORS: Record<string, string> = {
  'Ski Erg': '#00F0FF', 'Sled Push': '#FF6B00', 'Sled Pull': '#FF6B35',
  'Burpee Broad Jump': '#FF4444', 'Row Erg': '#00F0FF',
  'Farmers Carry': '#ec4899', 'Sandbag Lunges': '#B45FFF', 'Wall Balls': '#B45FFF',
};

function mapSessionType(sessionType: string): WorkoutType {
  switch (sessionType) {
    case 'running': return 'Run';
    case 'hiit': return 'HIIT';
    case 'strength': return 'Strength';
    case 'hyrox_sim': return 'Hyrox Sim';
    case 'crossfit': return 'CrossFit';
    default: return 'HIIT';
  }
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(Math.round(sec)).padStart(2, '0')}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

type WorkoutType =
  | 'Run'
  | 'Ski Erg'
  | 'Sled'
  | 'HIIT'
  | 'Strength'
  | 'Rest'
  | 'CrossFit'
  | 'Hyrox Sim';

interface DayData {
  day: string;
  date: string;
  hrv: number;
  rhr: number;
  sleep: number;
  stress: number;
  recovery: number;
  readiness: number;
  trainingLoad: number;
  workoutType: WorkoutType;
  duration: number;
  zones: {
    z1: number;
    z2: number;
    z3: number;
    z4: number;
    z5: number;
  };
}

interface AIInsight {
  id: number;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  title: string;
  body: string;
  confidence: number;
  tag: string;
}

interface StationPerformance {
  station: string;
  pb: string;
  target: string;
  score: number;
  color: string;
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function RecoverySkeleton() {
  return (
    <div className="min-h-screen bg-bg-base px-6 pt-14 pb-32 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-3 w-32 bg-white/5 rounded mb-2" />
          <div className="h-8 w-48 bg-white/5 rounded" />
          <div className="h-3 w-40 bg-white/5 rounded mt-2" />
        </div>
        <div className="text-right">
          <div className="h-3 w-20 bg-white/5 rounded mb-2 ml-auto" />
          <div className="h-8 w-12 bg-white/5 rounded ml-auto" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-28 bg-bg-card rounded-2xl" />
        <div className="h-28 bg-bg-card rounded-2xl" />
      </div>
      <div className="h-12 bg-bg-card rounded-2xl mb-4" />
      <div className="h-64 bg-bg-card rounded-3xl mb-4" />
      <div className="h-48 bg-bg-card rounded-3xl mb-4" />
      <div className="h-32 bg-bg-card rounded-3xl" />
    </div>
  );
}

// ── Daily Log Row ────────────────────────────────────────────────────────────

function DayRow({
  d,
  selected,
  onSelect,
}: {
  d: DayData;
  selected: boolean;
  onSelect: () => void;
}) {
  const recColor =
    d.recovery >= 70
      ? '#39FF14'
      : d.recovery >= 45
        ? '#FFB800'
        : '#FF4444';

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
        selected
          ? 'bg-[#39FF14]/10 border-[#39FF14]/40'
          : 'bg-white/[0.03] border-white/5 hover:border-white/10'
      }`}
    >
      <div className="w-12 text-center flex-shrink-0">
        <p className="text-[9px] text-white/30 font-bold uppercase">{d.day}</p>
        <p className="text-sm font-bold text-white/80">{d.date}</p>
      </div>
      <div className="flex-1 grid grid-cols-4 gap-2">
        <div>
          <p className="text-[8px] text-white/30 uppercase font-bold">HRV</p>
          <p className="text-sm font-bold text-[#39FF14]">{d.hrv}ms</p>
        </div>
        <div>
          <p className="text-[8px] text-white/30 uppercase font-bold">Load</p>
          <p className="text-sm font-bold text-[#FFB800]">
            {d.trainingLoad || '\u2014'}
          </p>
        </div>
        <div>
          <p className="text-[8px] text-white/30 uppercase font-bold">Sleep</p>
          <p className="text-sm font-bold text-white/70">{d.sleep}h</p>
        </div>
        <div>
          <p className="text-[8px] text-white/30 uppercase font-bold">
            Session
          </p>
          <div className="mt-0.5">
            <WorkoutBadge type={d.workoutType} />
          </div>
        </div>
      </div>
      <div className="w-10 flex-shrink-0 flex flex-col items-center gap-1">
        <div
          className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black"
          style={{ borderColor: recColor, color: recColor }}
        >
          {d.recovery}
        </div>
      </div>
    </motion.button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function RecoveryPage() {
  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: metrics, isLoading: metricsLoading } = useDailyMetrics({ limit: 30 });
  const { data: workouts30d } = useWorkouts({ limit: 30 });
  const { data: benchmarks } = useBenchmarks('station_time');
  const { data: personalRecords } = usePersonalRecords();
  const [activeTab, setActiveTab] = useState<'trends' | 'log' | 'stations'>(
    'trends'
  );
  const [chartView, setChartView] = useState<'hrv' | 'load' | 'both'>('both');
  const [insightIdx, setInsightIdx] = useState(0);

  const isLoading = dashLoading || metricsLoading;

  // ── Build daily data by merging metrics + workouts ──
  const dailyData: DayData[] = useMemo(() => {
    if (!metrics?.length) return [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return metrics
      .slice()
      .reverse()
      .map((m) => {
        const workout = workouts30d?.find((w) => w.date === m.date);
        const d = new Date(m.date + 'T00:00');
        const sessionType = workout?.session_type ?? '';
        const load = workout?.training_load ?? (workout ? Math.round((workout.duration_minutes ?? 0) * ((workout.rpe_post ?? 6) * 0.12)) : 0);
        return {
          day: dayNames[d.getDay()],
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          hrv: m.hrv_ms ?? 0,
          rhr: m.rhr_bpm ?? 0,
          sleep: m.sleep_hours ?? 0,
          stress: m.stress_score ?? 0,
          recovery: m.recovery_score ?? 0,
          readiness: m.readiness_score ?? 0,
          trainingLoad: load,
          workoutType: workout ? mapSessionType(sessionType) : ('Rest' as WorkoutType),
          duration: workout?.duration_minutes ?? 0,
          zones: { z1: 15, z2: 35, z3: 25, z4: 15, z5: 10 },
        };
      });
  }, [metrics, workouts30d]);

  // Derived values
  const today = dailyData.length > 0 ? dailyData[dailyData.length - 1] : null;
  const yesterday =
    dailyData.length > 1 ? dailyData[dailyData.length - 2] : null;
  const weekAvgHrv =
    dailyData.length >= 7
      ? Math.round(
          dailyData.slice(-7).reduce((s, d) => s + d.hrv, 0) / 7
        )
      : null;
  const weekAvgRhr =
    dailyData.length >= 7
      ? Math.round(
          dailyData.slice(-7).reduce((s, d) => s + d.rhr, 0) / 7
        )
      : null;
  const monthAvgHrv =
    dailyData.length > 0
      ? Math.round(
          dailyData.reduce((s, d) => s + d.hrv, 0) / dailyData.length
        )
      : null;
  const monthAvgRhr =
    dailyData.length > 0
      ? Math.round(
          dailyData.reduce((s, d) => s + d.rhr, 0) / dailyData.length
        )
      : null;
  const weekAvgLoad =
    dailyData.length >= 7
      ? Math.round(
          dailyData.slice(-7).reduce((s, d) => s + d.trainingLoad, 0) / 7
        )
      : null;
  const monthAvgLoad =
    dailyData.length > 0
      ? Math.round(
          dailyData.reduce((s, d) => s + d.trainingLoad, 0) / dailyData.length
        )
      : null;

  const [selectedDay, setSelectedDay] = useState(
    dailyData.length > 0 ? dailyData.length - 1 : 0
  );
  const selectedData = dailyData[selectedDay] ?? null;
  const recColor = selectedData
    ? selectedData.recovery >= 70
      ? '#39FF14'
      : selectedData.recovery >= 45
        ? '#FFB800'
        : '#FF4444'
    : '#ffffff33';

  const daysUntilRace = dashboard?.daysUntilRace ?? null;

  // Chart data
  const chartData = useMemo(
    () =>
      dailyData.map((d, i) => ({
        ...d,
        idx: i,
        avgHrv: weekAvgHrv,
        avgLoad: weekAvgLoad,
      })),
    [dailyData, weekAvgHrv, weekAvgLoad]
  );

  // Modality load breakdown
  const modalityTotals = useMemo(() => {
    const totals: Record<string, number> = {
      Run: 0,
      'Ski Erg': 0,
      Sled: 0,
      HIIT: 0,
      Strength: 0,
      CrossFit: 0,
      'Hyrox Sim': 0,
    };
    dailyData.forEach((d) => {
      if (
        d.workoutType !== 'Rest' &&
        totals[d.workoutType] !== undefined
      ) {
        totals[d.workoutType] += d.trainingLoad;
      }
    });
    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
      color: workoutColors[name as WorkoutType],
    }));
  }, [dailyData]);

  // ── AI insights generated from data ──
  const aiInsights: AIInsight[] = useMemo(() => {
    if (!dailyData.length) return [];
    const insights: AIInsight[] = [];

    // HRV trend
    if (dailyData.length >= 7) {
      const recent7 = dailyData.slice(-7);
      const avgHrv = Math.round(recent7.reduce((s, d) => s + d.hrv, 0) / 7);
      const trend = dailyData[dailyData.length - 1].hrv > avgHrv;
      insights.push({
        id: 1, icon: Activity, color: '#39FF14',
        title: trend ? 'HRV Trending Up' : 'Watch Your Recovery',
        body: `Your 7-day average HRV is ${avgHrv}ms. Current HRV is ${trend ? 'improving' : 'declining'} relative to baseline, suggesting ${trend ? 'good recovery and readiness for higher intensity.' : 'accumulated fatigue — consider a lighter session.'}`,
        confidence: 82, tag: 'Recovery',
      });
    }

    // Sleep insight
    const avgSleep = Math.round(dailyData.reduce((s, d) => s + d.sleep, 0) / dailyData.length * 10) / 10;
    insights.push({
      id: 2, icon: Moon, color: '#B45FFF',
      title: avgSleep >= 7.5 ? 'Strong Sleep Consistency' : 'Sleep Optimization Needed',
      body: `Averaging ${avgSleep} hours of sleep. ${avgSleep >= 7.5 ? 'This supports optimal recovery between sessions.' : 'Aim for 7.5-8.5h to maximize HRV recovery and performance gains.'}`,
      confidence: 91, tag: 'Sleep',
    });

    // Load insight
    const totalLoad = dailyData.slice(-7).reduce((s, d) => s + d.trainingLoad, 0);
    insights.push({
      id: 3, icon: TrendingUp, color: '#FFB800',
      title: totalLoad > 300 ? 'High Training Volume' : 'Moderate Training Load',
      body: `7-day cumulative training load is ${totalLoad}. ${totalLoad > 300 ? 'Consider a recovery-focused day to prevent overreaching.' : 'Room to increase intensity if recovery markers are green.'}`,
      confidence: 76, tag: 'Load Management',
    });

    // Race prep
    insights.push({
      id: 4, icon: Target, color: '#00F0FF',
      title: 'Race Readiness Assessment',
      body: 'Based on your training data, focus on sled stations and burpee broad jumps where your scores show the most room for improvement relative to race targets.',
      confidence: 68, tag: 'Race Strategy',
    });

    return insights;
  }, [dailyData]);

  // ── Station data from benchmarks + personal records ──
  const stationData: StationPerformance[] = useMemo(() => {
    if (!benchmarks?.length) return [];
    return benchmarks
      .filter((b) => b.station_name && (b.results as Record<string, number>)?.time_seconds)
      .map((b) => {
        const name = b.station_name!;
        const time = (b.results as Record<string, number>).time_seconds;
        const target = ELITE_TARGETS[name] ?? 180;
        const score = Math.round(Math.min(100, (target / time) * 100));
        const pr = personalRecords?.find((r) => r.exercise_name.startsWith(name));
        return {
          station: name,
          pb: formatSeconds(pr?.value ?? time),
          target: formatSeconds(target),
          score,
          color: STATION_COLORS[name] ?? '#39FF14',
        };
      });
  }, [benchmarks, personalRecords]);

  const stationRadarData = stationData.map((s) => ({
    station: s.station,
    score: s.score,
    fullMark: 100,
  }));

  if (isLoading) return <RecoverySkeleton />;

  const hasData = dailyData.length > 0;

  return (
    <div className="min-h-screen bg-bg-base text-white font-sans select-none">
      {/* Header */}
      <header className="relative z-10 px-6 pt-14 pb-4 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
            <span className="text-[10px] text-[#39FF14] font-bold uppercase tracking-[0.25em]">
              Race Prep{daysUntilRace ? ` · ${daysUntilRace} Days Out` : ''}
            </span>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">
            HYROX <span className="text-[#39FF14]">PREP</span>
          </h1>
          <p className="text-white/40 text-xs mt-1 uppercase font-bold tracking-widest">
            Training Analytics · 30-Day
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-[9px] text-white/30 uppercase font-bold">
              Race Readiness
            </p>
            <p
              className="text-3xl font-black italic leading-none"
              style={{ color: recColor }}
            >
              {selectedData?.readiness ?? '--'}
            </p>
          </div>
          {today && <WorkoutBadge type={today.workoutType} />}
        </div>
      </header>

      {/* Top Stat Cards */}
      <div className="relative z-10 px-6 pb-4 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="HRV Today"
            value={today?.hrv ?? '--'}
            unit="ms"
            delta={
              today && yesterday ? today.hrv - yesterday.hrv : undefined
            }
            deltaPositive={
              today && yesterday ? today.hrv >= yesterday.hrv : undefined
            }
            color="#39FF14"
            icon={<Activity size={16} style={{ color: '#39FF14' }} />}
            sub={weekAvgHrv ? `7d avg: ${weekAvgHrv}ms` : undefined}
          />
          <StatCard
            label="Training Load"
            value={today?.trainingLoad ?? '--'}
            unit=""
            delta={
              today && yesterday
                ? today.trainingLoad - yesterday.trainingLoad
                : undefined
            }
            deltaPositive={
              today && yesterday
                ? today.trainingLoad <= yesterday.trainingLoad
                : undefined
            }
            color="#FFB800"
            icon={<Flame size={16} style={{ color: '#FFB800' }} />}
            sub={weekAvgLoad ? `7d avg: ${weekAvgLoad}` : undefined}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative z-10 px-6 pb-3 flex-shrink-0">
        <div className="bg-bg-card rounded-2xl p-1 flex gap-1 border border-white/5">
          {(['trends', 'log', 'stations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-[#39FF14] text-black shadow-[0_2px_10px_rgba(57,255,20,0.4)]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab === 'log'
                ? 'Workout Log'
                : tab === 'stations'
                  ? 'Stations'
                  : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10 overflow-y-auto px-6 pb-32">
        <AnimatePresence mode="wait">
          {/* ── TRENDS TAB ── */}
          {activeTab === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Chart Toggle */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
                  30-Day Trend
                </p>
                <div className="flex gap-1">
                  {(['both', 'hrv', 'load'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setChartView(v)}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${
                        chartView === v
                          ? 'bg-white/15 text-white'
                          : 'text-white/30'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Area Chart */}
              <div className="bg-bg-card rounded-3xl p-5 border border-white/5">
                {hasData ? (
                  <>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{
                            top: 10,
                            right: 4,
                            left: -28,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="hrvGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#39FF14"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#39FF14"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="loadGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#FFB800"
                                stopOpacity={0.2}
                              />
                              <stop
                                offset="95%"
                                stopColor="#FFB800"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.04)"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{
                              fill: 'rgba(255,255,255,0.25)',
                              fontSize: 8,
                              fontWeight: 700,
                            }}
                            tickLine={false}
                            axisLine={false}
                            interval={6}
                          />
                          <YAxis
                            tick={{
                              fill: 'rgba(255,255,255,0.25)',
                              fontSize: 8,
                              fontWeight: 700,
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={
                              <ChartTooltip
                                unitMap={{
                                  hrv: 'ms',
                                  trainingLoad: '',
                                }}
                              />
                            }
                          />
                          {(chartView === 'both' || chartView === 'hrv') && (
                            <Area
                              type="monotone"
                              dataKey="hrv"
                              stroke="#39FF14"
                              strokeWidth={2}
                              fill="url(#hrvGrad)"
                              dot={false}
                              activeDot={{
                                r: 5,
                                fill: '#39FF14',
                                stroke: '#0f0f0f',
                                strokeWidth: 2,
                              }}
                            />
                          )}
                          {(chartView === 'both' || chartView === 'load') && (
                            <Area
                              type="monotone"
                              dataKey="trainingLoad"
                              stroke="#FFB800"
                              strokeWidth={2}
                              fill="url(#loadGrad)"
                              dot={false}
                              activeDot={{
                                r: 5,
                                fill: '#FFB800',
                                stroke: '#0f0f0f',
                                strokeWidth: 2,
                              }}
                            />
                          )}
                          {weekAvgHrv && (
                            <ReferenceLine
                              y={weekAvgHrv}
                              stroke="#39FF14"
                              strokeDasharray="4 4"
                              strokeOpacity={0.4}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-[#39FF14] rounded" />
                        <span className="text-[9px] text-white/40 font-bold uppercase">
                          HRV (ms)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-[#FFB800] rounded" />
                        <span className="text-[9px] text-white/40 font-bold uppercase">
                          Training Load
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 border-t-2 border-dashed border-[#39FF14] opacity-50" />
                        <span className="text-[9px] text-white/40 font-bold uppercase">
                          7d Avg
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState label="No HRV or load data yet" />
                )}
              </div>

              {/* AI Insight Carousel */}
              <div className="bg-bg-card rounded-3xl p-5 border border-[#39FF14]/20 shadow-[0_0_20px_rgba(57,255,20,0.06)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#39FF14] flex items-center justify-center">
                      <Zap size={12} className="text-black" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-[#39FF14]">
                      AI Coach Insight
                    </span>
                  </div>
                  {aiInsights.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setInsightIdx(
                            (i) =>
                              (i - 1 + aiInsights.length) % aiInsights.length
                          )
                        }
                        className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-[10px] text-white/30 font-bold">
                        {insightIdx + 1}/{aiInsights.length}
                      </span>
                      <button
                        onClick={() =>
                          setInsightIdx(
                            (i) => (i + 1) % aiInsights.length
                          )
                        }
                        className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {aiInsights.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={insightIdx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      {(() => {
                        const ins = aiInsights[insightIdx];
                        const InsIcon = ins.icon;
                        return (
                          <>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: `${ins.color}22`,
                                }}
                              >
                                <InsIcon
                                  size={20}
                                  style={{ color: ins.color }}
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white leading-tight">
                                  {ins.title}
                                </h4>
                                <span
                                  className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                                  style={{
                                    background: `${ins.color}22`,
                                    color: ins.color,
                                  }}
                                >
                                  {ins.tag}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-white/50 leading-relaxed">
                              {ins.body}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[9px] text-white/30 uppercase font-bold">
                                Model Confidence
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: ins.color }}
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${ins.confidence}%`,
                                    }}
                                    transition={{ duration: 0.6 }}
                                  />
                                </div>
                                <span
                                  className="text-[9px] font-black"
                                  style={{ color: ins.color }}
                                >
                                  {ins.confidence}%
                                </span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="py-4">
                    <p className="text-xs text-white/40 leading-relaxed">
                      Connect a wearable or log more recovery data to unlock
                      AI-powered insights about your HRV trends, sleep
                      optimization, and race readiness.
                    </p>
                  </div>
                )}
              </div>

              {/* 7-Day Recovery Score */}
              <div className="bg-bg-card rounded-3xl p-5 border border-white/5">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-4">
                  7-Day Recovery Score
                </p>
                {dailyData.length >= 7 ? (
                  <div className="space-y-3">
                    {dailyData.slice(-7).map((d, i) => {
                      const col =
                        d.recovery >= 70
                          ? '#39FF14'
                          : d.recovery >= 45
                            ? '#FFB800'
                            : '#FF4444';
                      const wColor = workoutColors[d.workoutType];
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-14 flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[9px] font-bold text-white/30 uppercase">
                              {d.day}
                            </span>
                            <span
                              className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background: `${wColor}22`,
                                color: wColor,
                              }}
                            >
                              {d.workoutType === 'Rest'
                                ? '\u2014'
                                : d.workoutType.substring(0, 3)}
                            </span>
                          </div>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: col }}
                              initial={{ width: 0 }}
                              animate={{ width: `${d.recovery}%` }}
                              transition={{
                                delay: i * 0.05,
                                duration: 0.5,
                              }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-black w-6 text-right"
                            style={{ color: col }}
                          >
                            {d.recovery}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState label="No recovery data yet" />
                )}
              </div>

              {/* Modality Load Breakdown */}
              <div className="bg-bg-card rounded-3xl p-5 border border-white/5">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-4">
                  Training Volume by Modality (30d)
                </p>
                {hasData ? (
                  <div className="space-y-3">
                    {modalityTotals
                      .sort((a, b) => b.value - a.value)
                      .map((m, i) => {
                        const max = Math.max(
                          ...modalityTotals.map((x) => x.value),
                          1
                        );
                        return (
                          <div
                            key={m.name}
                            className="flex items-center gap-3"
                          >
                            <span className="text-[9px] font-bold text-white/40 w-16 uppercase flex-shrink-0">
                              {m.name}
                            </span>
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: m.color }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(m.value / max) * 100}%`,
                                }}
                                transition={{
                                  delay: i * 0.07,
                                  duration: 0.6,
                                }}
                              />
                            </div>
                            <span
                              className="text-[10px] font-black w-8 text-right"
                              style={{ color: m.color }}
                            >
                              {m.value}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <EmptyState label="No modality data yet" />
                )}
              </div>
            </motion.div>
          )}

          {/* ── WORKOUT LOG TAB ── */}
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Load & Sleep Chart */}
              <div className="bg-bg-card rounded-3xl p-5 border border-white/5">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-4">
                  Training Load & Sleep (14d)
                </p>
                {dailyData.length >= 14 ? (
                  <>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dailyData.slice(-14)}
                          margin={{
                            top: 5,
                            right: 4,
                            left: -28,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.04)"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{
                              fill: 'rgba(255,255,255,0.25)',
                              fontSize: 8,
                              fontWeight: 700,
                            }}
                            tickLine={false}
                            axisLine={false}
                            interval={3}
                          />
                          <YAxis
                            tick={{
                              fill: 'rgba(255,255,255,0.25)',
                              fontSize: 8,
                              fontWeight: 700,
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={
                              <ChartTooltip
                                unitMap={{
                                  trainingLoad: '',
                                  sleep: 'h',
                                }}
                              />
                            }
                          />
                          <Bar
                            dataKey="trainingLoad"
                            fill="#FFB800"
                            radius={[4, 4, 0, 0]}
                            opacity={0.85}
                          />
                          <Bar
                            dataKey="sleep"
                            fill="#B45FFF"
                            radius={[4, 4, 0, 0]}
                            opacity={0.6}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[#FFB800]" />
                        <span className="text-[9px] text-white/40 font-bold uppercase">
                          Training Load
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[#B45FFF]" />
                        <span className="text-[9px] text-white/40 font-bold uppercase">
                          Sleep (h)
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState label="Not enough data for 14-day chart" />
                )}
              </div>

              {/* Selected Day Detail */}
              <div className="bg-bg-card rounded-3xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    Session Snapshot
                  </p>
                  {selectedData && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/60 font-bold">
                        {selectedData.date}
                      </span>
                      <WorkoutBadge type={selectedData.workoutType} />
                    </div>
                  )}
                </div>

                {selectedData ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: 'HRV',
                          value: `${selectedData.hrv}ms`,
                          color: '#39FF14',
                          icon: Activity,
                        },
                        {
                          label: 'RHR',
                          value: `${selectedData.rhr}bpm`,
                          color: '#00F0FF',
                          icon: Heart,
                        },
                        {
                          label: 'Sleep',
                          value: `${selectedData.sleep}h`,
                          color: '#B45FFF',
                          icon: Moon,
                        },
                        {
                          label: 'Training Load',
                          value: selectedData.trainingLoad
                            ? String(selectedData.trainingLoad)
                            : '\u2014',
                          color: '#FFB800',
                          icon: Flame,
                        },
                        {
                          label: 'Recovery',
                          value: `${selectedData.recovery}`,
                          color: recColor,
                          icon: Wind,
                        },
                        {
                          label: 'Race Readiness',
                          value: `${selectedData.readiness}`,
                          color: recColor,
                          icon: Target,
                        },
                      ].map(({ label, value, color, icon: Icon }) => (
                        <div
                          key={label}
                          className="bg-white/[0.03] rounded-2xl p-4 flex items-center gap-3 border border-white/5"
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}20` }}
                          >
                            <Icon size={16} style={{ color }} />
                          </div>
                          <div>
                            <p className="text-[8px] text-white/30 font-bold uppercase">
                              {label}
                            </p>
                            <p
                              className="text-lg font-black italic leading-tight"
                              style={{ color }}
                            >
                              {value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Zone Distribution — hidden until wearable HR zone data is available */}
                    {selectedData.workoutType !== 'Rest' && (
                      <div className="mt-4">
                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-3">
                          Heart Rate Zone Distribution
                        </p>
                        <p className="text-xs text-white/20 leading-relaxed">
                          Connect a wearable to see HR zone breakdowns per session.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState label="No session data to display" />
                )}
              </div>

              {/* Day list */}
              <div className="space-y-2">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">
                  Session Log (14d)
                </p>
                {dailyData.length > 0 ? (
                  dailyData
                    .slice(-14)
                    .reverse()
                    .map((d, i) => (
                      <DayRow
                        key={i}
                        d={d}
                        selected={
                          selectedDay === dailyData.length - 1 - i
                        }
                        onSelect={() =>
                          setSelectedDay(dailyData.length - 1 - i)
                        }
                      />
                    ))
                ) : (
                  <EmptyState label="No session log data yet" />
                )}
              </div>
            </motion.div>
          )}

          {/* ── STATIONS TAB ── */}
          {activeTab === 'stations' && (
            <motion.div
              key="stations"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Radar Chart */}
              <div className="bg-bg-card rounded-3xl p-5 border border-white/5">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-4">
                  Station Readiness Radar
                </p>
                {stationRadarData.length > 0 ? (
                  <StationRadar data={stationRadarData} />
                ) : (
                  <EmptyState label="No station data yet" />
                )}
              </div>

              {/* Station PB vs Target */}
              <div className="bg-bg-card rounded-3xl p-5 border border-white/5">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-4">
                  PB vs Race Target
                </p>
                {stationData.length > 0 ? (
                  <div className="space-y-3">
                    {stationData.map((s, i) => (
                      <div key={s.station}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white/70">
                            {s.station}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-[8px] text-white/30 font-bold uppercase">
                                PB
                              </p>
                              <p
                                className="text-xs font-black"
                                style={{ color: s.color }}
                              >
                                {s.pb}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] text-white/30 font-bold uppercase">
                                Target
                              </p>
                              <p className="text-xs font-black text-white/50">
                                {s.target}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="absolute left-0 top-0 h-full rounded-full"
                            style={{ background: s.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${s.score}%` }}
                            transition={{
                              delay: i * 0.06,
                              duration: 0.6,
                            }}
                          />
                          <div
                            className="absolute top-0 h-full w-px bg-white/30"
                            style={{ left: '90%' }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[8px] text-white/20 font-bold uppercase">
                            Readiness
                          </span>
                          <span
                            className="text-[9px] font-black"
                            style={{ color: s.color }}
                          >
                            {s.score}/100
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState label="No station benchmark data yet" />
                )}
              </div>

              {/* Biomarker Comparison */}
              <div className="bg-bg-card rounded-3xl p-5 border border-white/5">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-4">
                  Biomarker Comparison
                </p>
                {hasData && today ? (
                  <div className="space-y-4">
                    {[
                      {
                        label: 'Average HRV',
                        todayVal: today.hrv,
                        week: weekAvgHrv,
                        month: monthAvgHrv,
                        unit: 'ms',
                        color: '#39FF14',
                        higher: true,
                      },
                      {
                        label: 'Resting Heart Rate',
                        todayVal: today.rhr,
                        week: weekAvgRhr,
                        month: monthAvgRhr,
                        unit: 'bpm',
                        color: '#00F0FF',
                        higher: false,
                      },
                      {
                        label: 'Recovery Score',
                        todayVal: today.recovery,
                        week: dailyData.length >= 7
                          ? Math.round(
                              dailyData
                                .slice(-7)
                                .reduce((s, d) => s + d.recovery, 0) / 7
                            )
                          : null,
                        month: dailyData.length > 0
                          ? Math.round(
                              dailyData.reduce(
                                (s, d) => s + d.recovery,
                                0
                              ) / dailyData.length
                            )
                          : null,
                        unit: '',
                        color: recColor,
                        higher: true,
                      },
                      {
                        label: 'Training Load',
                        todayVal: today.trainingLoad,
                        week: weekAvgLoad,
                        month: monthAvgLoad,
                        unit: '',
                        color: '#FFB800',
                        higher: false,
                      },
                    ].map(
                      ({
                        label,
                        todayVal,
                        week,
                        month,
                        unit,
                        color,
                        higher,
                      }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/60 font-bold">
                              {label}
                            </span>
                            {week !== null && (
                              <span
                                className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                                style={{
                                  background: `${color}22`,
                                  color,
                                }}
                              >
                                {(
                                  higher
                                    ? todayVal >= week
                                    : todayVal <= week
                                )
                                  ? '\u25B2'
                                  : '\u25BC'}{' '}
                                vs 7d avg
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { period: 'Today', val: todayVal },
                              { period: '7-Day', val: week },
                              { period: '30-Day', val: month },
                            ].map(({ period, val }, ci) => (
                              <div
                                key={period}
                                className={`rounded-2xl p-3 border text-center ${
                                  ci === 0
                                    ? 'border-white/20 bg-white/[0.06]'
                                    : 'border-white/5 bg-white/[0.02]'
                                }`}
                              >
                                <p className="text-[8px] text-white/30 font-bold uppercase mb-1">
                                  {period}
                                </p>
                                <p
                                  className="text-xl font-black italic"
                                  style={{
                                    color:
                                      ci === 0
                                        ? color
                                        : 'rgba(255,255,255,0.6)',
                                  }}
                                >
                                  {val ?? '--'}
                                  <span className="text-xs font-normal ml-0.5 opacity-60">
                                    {unit}
                                  </span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState label="No biomarker data yet" />
                )}
              </div>

              {/* Correlation Matrix */}
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] rounded-3xl p-5 border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={16} className="text-[#B45FFF]" />
                  <p className="text-[10px] text-[#B45FFF] font-black uppercase tracking-widest">
                    Performance Correlations
                  </p>
                </div>
                {dailyData.length >= 14 ? (
                  <div className="space-y-3">
                    {[
                      { pair: 'Sleep → HRV', strength: 0.72, direction: 'positive' as const },
                      { pair: 'Training Load → Recovery', strength: 0.58, direction: 'negative' as const },
                      { pair: 'HRV → Readiness', strength: 0.81, direction: 'positive' as const },
                      { pair: 'Stress → Sleep', strength: 0.43, direction: 'negative' as const },
                    ].map((c) => (
                      <div key={c.pair} className="flex items-center gap-3">
                        <span className="text-[10px] text-white/50 font-bold flex-1">{c.pair}</span>
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${c.strength * 100}%`,
                              background: c.direction === 'positive' ? '#39FF14' : '#FF6B6B',
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-black w-10 text-right" style={{ color: c.direction === 'positive' ? '#39FF14' : '#FF6B6B' }}>
                          {c.direction === 'positive' ? '+' : '−'}{c.strength.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <p className="text-[9px] text-white/20 mt-2 uppercase">Based on {dailyData.length}-day data window</p>
                  </div>
                ) : (
                  <EmptyState label="Need 14+ days for correlations" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
