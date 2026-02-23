'use client';

import { useState, useCallback, memo, use } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  CheckCircle2,
  Plus,
  Check,
  Zap,
  Timer,
  Flame,
  TrendingUp,
  Activity,
  Wind,
  Dumbbell,
  Target,
  Waves,
  RotateCcw,
  BarChart2,
  Footprints,
} from 'lucide-react';
import Link from 'next/link';
import { useWorkoutTimer } from '@/hooks/use-workout-timer';
import { AudioWaveform } from '@/components/shared';

// ── Types ────────────────────────────────────────────────────────────────────

type SetStatus = 'pending' | 'done' | 'skipped';

interface LoggedSet {
  id: number;
  reps?: number;
  weight?: number;
  distance?: number;
  time?: string;
  pace?: string;
  status: SetStatus;
  notes?: string;
}

interface ExerciseBlock {
  id: string;
  name: string;
  category: string;
  iconKey: string;
  color: string;
  sets: LoggedSet[];
  targetSets: number;
  targetReps?: number;
  targetDistance?: number;
  targetTime?: string;
  unit: 'reps' | 'distance' | 'time';
  isExpanded: boolean;
}

interface Exercise {
  block: string;
  name: string;
  duration: string;
  weight?: string;
  reps?: string;
  sets?: string;
  details?: string;
  distance?: string;
  pace?: string;
}

// ── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof Activity> = {
  footprints: Footprints,
  wind: Wind,
  target: Target,
  rotateccw: RotateCcw,
  dumbbell: Dumbbell,
  waves: Waves,
  zap: Zap,
  barchart2: BarChart2,
  flame: Flame,
  activity: Activity,
};

function getIcon(key: string) {
  return ICON_MAP[key.toLowerCase()] ?? Activity;
}

// ── Mock Data ────────────────────────────────────────────────────────────────
// TODO: Load workout plan from /api/training-plans/[id]/days/[dayId]

const SESSION_EXERCISES: Exercise[] = [
  {
    block: 'Block 1: Running Segment',
    name: 'Tempo Run Intervals',
    duration: '20 MIN',
    distance: '4 x 800m',
    pace: '4:10/km',
    details:
      'Target 4:10/km per interval. Full 90s recovery between each. Focus on maintaining cadence above 170spm.',
  },
  {
    block: 'Block 2: Station Work',
    name: 'SkiErg + Sled Push Ladder',
    duration: '25 MIN',
    sets: '5',
    reps: '250m',
    weight: '120 KG',
    details:
      '250m SkiErg immediately into 20m sled push. Rest 2 minutes between rounds. Damper setting 7.',
  },
  {
    block: 'Block 3: Functional Strength',
    name: 'Farmer Carry + Wall Balls',
    duration: '15 MIN',
    sets: '4',
    reps: '20',
    weight: '32 KG',
    details:
      '40m farmer carry (32kg/hand) directly into 20 wall balls @9kg to 10ft target. Unbroken wall balls are the goal.',
  },
];

const initialBlocks: ExerciseBlock[] = [
  {
    id: 'run1',
    name: '1km Run',
    category: 'Run',
    iconKey: 'footprints',
    color: '#39FF14',
    sets: [
      { id: 1, distance: 1000, time: '4:12', pace: '4:12/km', status: 'done' },
      { id: 2, distance: 1000, time: '4:08', pace: '4:08/km', status: 'done' },
      { id: 3, distance: 1000, status: 'pending' },
    ],
    targetSets: 3,
    targetDistance: 1000,
    unit: 'distance',
    isExpanded: false,
  },
  {
    id: 'skierg',
    name: 'SkiErg',
    category: 'Ski Erg',
    iconKey: 'wind',
    color: '#00F0FF',
    sets: [
      { id: 1, distance: 1000, time: '3:52', status: 'done' },
      { id: 2, distance: 1000, status: 'pending' },
    ],
    targetSets: 2,
    targetDistance: 1000,
    unit: 'distance',
    isExpanded: false,
  },
  {
    id: 'sled',
    name: 'Sled Push',
    category: 'Sled',
    iconKey: 'target',
    color: '#FF6B35',
    sets: [
      { id: 1, distance: 25, weight: 152, status: 'done' },
      { id: 2, distance: 25, weight: 152, status: 'pending' },
      { id: 3, distance: 25, weight: 152, status: 'pending' },
      { id: 4, distance: 25, weight: 152, status: 'pending' },
    ],
    targetSets: 4,
    targetDistance: 25,
    unit: 'distance',
    isExpanded: true,
  },
  {
    id: 'wallballs',
    name: 'Wall Balls',
    category: 'Wall Balls',
    iconKey: 'rotateccw',
    color: '#BF5FFF',
    sets: [{ id: 1, reps: 75, status: 'pending' }],
    targetSets: 1,
    targetReps: 75,
    unit: 'reps',
    isExpanded: false,
  },
  {
    id: 'farmers',
    name: 'Farmers Carry',
    category: 'Farmers',
    iconKey: 'dumbbell',
    color: '#39FF14',
    sets: [
      { id: 1, distance: 200, weight: 24, status: 'pending' },
      { id: 2, distance: 200, weight: 24, status: 'pending' },
    ],
    targetSets: 2,
    targetDistance: 200,
    unit: 'distance',
    isExpanded: false,
  },
  {
    id: 'row',
    name: 'Rowing',
    category: 'Row',
    iconKey: 'waves',
    color: '#00F0FF',
    sets: [
      { id: 1, distance: 1000, status: 'pending' },
      { id: 2, distance: 1000, status: 'pending' },
    ],
    targetSets: 2,
    targetDistance: 1000,
    unit: 'distance',
    isExpanded: false,
  },
  {
    id: 'burpee',
    name: 'Burpee Broad Jumps',
    category: 'Burpee',
    iconKey: 'zap',
    color: '#FF6B35',
    sets: [{ id: 1, reps: 80, status: 'pending' }],
    targetSets: 1,
    targetReps: 80,
    unit: 'reps',
    isExpanded: false,
  },
  {
    id: 'sandbag',
    name: 'Sandbag Lunges',
    category: 'Sandbag',
    iconKey: 'barchart2',
    color: '#BF5FFF',
    sets: [
      { id: 1, distance: 100, weight: 20, status: 'pending' },
      { id: 2, distance: 100, weight: 20, status: 'pending' },
    ],
    targetSets: 2,
    targetDistance: 100,
    unit: 'distance',
    isExpanded: false,
  },
];

// ── SetRow ───────────────────────────────────────────────────────────────────

const SetRow = memo(
  ({
    set,
    block,
    index,
    onToggle,
  }: {
    set: LoggedSet;
    block: ExerciseBlock;
    index: number;
    onToggle: (setId: number) => void;
  }) => {
    const isDone = set.status === 'done';
    return (
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: index * 0.05 }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
          isDone
            ? 'bg-white/3 border-white/5 opacity-60'
            : 'bg-white/5 border-white/8'
        }`}
      >
        <span className="text-[10px] font-black text-white/20 w-4">S{index + 1}</span>

        <div className="flex-1 flex items-center gap-3 flex-wrap">
          {set.distance !== undefined && (
            <span className={`text-xs font-bold ${isDone ? 'text-white/50' : 'text-white'}`}>
              {set.distance}m
            </span>
          )}
          {set.weight !== undefined && (
            <span className="text-xs text-white/40 font-bold">{set.weight}kg</span>
          )}
          {set.reps !== undefined && (
            <span className={`text-xs font-bold ${isDone ? 'text-white/50' : 'text-white'}`}>
              {set.reps} reps
            </span>
          )}
          {set.time && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/60">
              {set.time}
            </span>
          )}
          {set.pace && (
            <span className="text-[10px] text-[#39FF14] font-bold">{set.pace}</span>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => onToggle(set.id)}
          className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
            isDone
              ? 'bg-[#39FF14]/20 border-[#39FF14]/40 text-[#39FF14]'
              : 'bg-white/5 border-white/15 text-white/30 hover:border-white/30'
          }`}
        >
          {isDone ? <Check size={12} /> : <div className="w-2 h-2 rounded-full bg-white/20" />}
        </motion.button>
      </motion.div>
    );
  }
);
SetRow.displayName = 'SetRow';

// ── BlockCard ────────────────────────────────────────────────────────────────

const BlockCard = memo(
  ({
    block,
    onToggleExpand,
    onToggleSet,
    onAddSet,
  }: {
    block: ExerciseBlock;
    onToggleExpand: (id: string) => void;
    onToggleSet: (blockId: string, setId: number) => void;
    onAddSet: (blockId: string) => void;
  }) => {
    const doneSets = block.sets.filter((s) => s.status === 'done').length;
    const progress = doneSets / block.sets.length;
    const isComplete = doneSets === block.sets.length;
    const Icon = getIcon(block.iconKey);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`bg-bg-card border rounded-2xl overflow-hidden transition-all ${
          isComplete ? 'border-white/5 opacity-75' : 'border-white/8'
        }`}
      >
        {/* Card header */}
        <button
          className="w-full flex items-center gap-3 px-4 py-3.5"
          onClick={() => onToggleExpand(block.id)}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${block.color}22`, color: block.color }}
          >
            <Icon size={15} />
          </div>

          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-tight text-white leading-none">
                {block.name}
              </span>
              {isComplete && <CheckCircle2 size={12} className="text-[#39FF14]" />}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-white/40">
                {doneSets}/{block.sets.length} sets
              </span>
              {block.targetDistance && (
                <span className="text-[10px] text-white/30">
                  &middot; {block.targetDistance}m target
                </span>
              )}
              {block.targetReps && (
                <span className="text-[10px] text-white/30">
                  &middot; {block.targetReps} reps target
                </span>
              )}
            </div>
          </div>

          {/* Progress ring + chevron */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="transparent"
                  className="text-white/5"
                />
                <motion.circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke={block.color}
                  strokeWidth="2.5"
                  fill="transparent"
                  strokeDasharray={75.4}
                  animate={{ strokeDashoffset: 75.4 - 75.4 * progress }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-[9px] font-black"
                style={{ color: block.color }}
              >
                {Math.round(progress * 100)}
              </span>
            </div>
            {block.isExpanded ? (
              <ChevronUp size={16} className="text-white/30" />
            ) : (
              <ChevronDown size={16} className="text-white/30" />
            )}
          </div>
        </button>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/5 mx-4">
          <motion.div
            className="h-full rounded-full"
            style={{ background: block.color }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Expanded sets */}
        <AnimatePresence>
          {block.isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pt-3 pb-2 space-y-2">
                {block.sets.map((set, i) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    block={block}
                    index={i}
                    onToggle={(setId) => onToggleSet(block.id, setId)}
                  />
                ))}
              </div>
              <div className="px-4 pb-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onAddSet(block.id)}
                  className="w-full py-2 rounded-xl bg-white/4 border border-white/8 text-[10px] text-white/40 font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:border-white/15 transition-colors"
                >
                  <Plus size={11} /> Add Set
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);
BlockCard.displayName = 'BlockCard';

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ActiveWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Timer
  const timer = useWorkoutTimer(id);

  // Exercise HUD state
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentExercise = SESSION_EXERCISES[currentExerciseIdx];

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceConfirmed, setVoiceConfirmed] = useState(false);

  // Block/set state
  const [blocks, setBlocks] = useState<ExerciseBlock[]>(initialBlocks);

  // Derived stats
  const totalSets = blocks.reduce((a, b) => a + b.sets.length, 0);
  const doneSets = blocks.reduce(
    (a, b) => a + b.sets.filter((s) => s.status === 'done').length,
    0
  );
  const overallPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const toggleExpand = useCallback((blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, isExpanded: !b.isExpanded } : b))
    );
  }, []);

  const toggleSet = useCallback((blockId: string, setId: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              sets: b.sets.map((s) =>
                s.id === setId
                  ? { ...s, status: s.status === 'done' ? 'pending' : 'done' }
                  : s
              ),
            }
          : b
      )
    );
  }, []);

  const addSet = useCallback((blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const last = b.sets[b.sets.length - 1];
        return {
          ...b,
          sets: [...b.sets, { ...last, id: Date.now(), status: 'pending' as SetStatus }],
        };
      })
    );
  }, []);

  const handleVoiceTap = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      setVoiceConfirmed(true);
      setTimeout(() => setVoiceConfirmed(false), 3000);
    } else {
      setVoiceTranscript('');
      setVoiceConfirmed(false);
      setIsListening(true);
      // Simulated transcript for demo
      setTimeout(() => {
        setVoiceTranscript('Sled push felt heavy today, dropped to 140kg');
      }, 1500);
    }
  }, [isListening]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-bg-deep text-white font-sans overflow-hidden flex flex-col select-none z-50"
    >
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[60%] h-[60%] opacity-8 bg-[radial-gradient(circle_at_center,_#39FF14_0%,_transparent_55%)]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] opacity-8 bg-[radial-gradient(circle_at_center,_#00F0FF_0%,_transparent_55%)]" />
      </div>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div
        className={`relative z-10 flex items-center justify-between px-6 mb-4 ${
          isFullscreen ? 'pt-6' : 'pt-6'
        }`}
      >
        <Link href="/log">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
            aria-label="End session"
          >
            <X size={20} />
          </motion.div>
        </Link>

        {/* Interactive Timer */}
        <button
          onClick={timer.isRunning ? timer.stop : timer.start}
          className="text-center group"
          aria-label={timer.isRunning ? 'Pause timer' : 'Resume timer'}
        >
          <p className="text-[10px] text-[#39FF14] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
            {timer.isRunning ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
                Live Session
              </>
            ) : (
              <>
                <Pause size={10} /> Paused
              </>
            )}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-lg font-mono font-bold tracking-widest">
              {timer.formatTime(timer.elapsed)}
            </span>
            <motion.div
              animate={{ opacity: timer.isRunning ? 0 : 1 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {timer.isRunning ? (
                <Pause size={12} className="text-white/30" />
              ) : (
                <Play size={12} className="text-[#39FF14]" />
              )}
            </motion.div>
          </div>
        </button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsFullscreen((f) => !f)}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#39FF14]"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </motion.button>
      </div>

      {/* ── Scrollable Content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {/* ── Exercise HUD ──────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center px-6 mb-8">
          {/* Exercise Navigator */}
          <div className="flex items-center gap-4 mb-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              disabled={currentExerciseIdx === 0}
              onClick={() => setCurrentExerciseIdx((i) => Math.max(0, i - 1))}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-20 transition-opacity"
              aria-label="Previous exercise"
            >
              <ChevronRight size={16} className="rotate-180" />
            </motion.button>
            <p className="text-[#39FF14] font-bold uppercase tracking-[0.3em] text-sm">
              {currentExercise.block}
            </p>
            <motion.button
              whileTap={{ scale: 0.85 }}
              disabled={currentExerciseIdx === SESSION_EXERCISES.length - 1}
              onClick={() =>
                setCurrentExerciseIdx((i) =>
                  Math.min(SESSION_EXERCISES.length - 1, i + 1)
                )
              }
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center disabled:opacity-20 transition-opacity"
              aria-label="Next exercise"
            >
              <ChevronRight size={16} />
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentExerciseIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter uppercase leading-none mb-6 px-4">
                {currentExercise.name.split(' ').slice(0, 2).join(' ')}
                <br />
                <span className="text-white/30">
                  {currentExercise.name.split(' ').slice(2).join(' ')}
                </span>
              </h1>
            </motion.div>
          </AnimatePresence>

          {/* Stats Row */}
          <div className="flex gap-8 mt-2 flex-wrap justify-center">
            {currentExercise.distance && (
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                  Distance
                </p>
                <p className="text-3xl font-bold italic text-[#00F0FF]">
                  {currentExercise.distance}
                </p>
              </div>
            )}
            {currentExercise.pace && (
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                  Pace
                </p>
                <p className="text-3xl font-bold italic text-[#39FF14]">
                  {currentExercise.pace}
                </p>
              </div>
            )}
            {currentExercise.weight && (
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                  Load
                </p>
                <p className="text-4xl font-bold italic">
                  {currentExercise.weight.split(' ')[0]}
                  <span className="text-sm text-white/40 not-italic ml-1">
                    {currentExercise.weight.split(' ')[1]}
                  </span>
                </p>
              </div>
            )}
            {currentExercise.sets && (
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                  Sets
                </p>
                <p className="text-4xl font-bold italic">{currentExercise.sets}</p>
              </div>
            )}
            {currentExercise.reps && (
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                  Target
                </p>
                <p className="text-4xl font-bold italic">
                  {currentExercise.reps}
                  <span className="text-sm text-white/40 not-italic ml-1">
                    x {currentExercise.duration}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Progress Dots */}
          <div className="flex gap-2 mt-8">
            {SESSION_EXERCISES.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrentExerciseIdx(i)}
                animate={{
                  scale: i === currentExerciseIdx ? 1 : 0.7,
                  backgroundColor:
                    i === currentExerciseIdx ? '#39FF14' : 'rgba(255,255,255,0.15)',
                }}
                className="w-2 h-2 rounded-full"
                aria-label={`Go to exercise ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ── Session Summary Banner ───────────────────────────────────── */}
        <section className="px-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="bg-gradient-to-br from-[#1a1a1a] to-[#161616] border border-white/8 rounded-3xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#39FF14]/6 rounded-bl-full" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] text-[#39FF14] font-black uppercase tracking-widest">
                    Session Progress
                  </span>
                  <h2 className="text-lg font-black italic uppercase tracking-tighter text-white mt-0.5 leading-none">
                    Full HYROX Sim
                  </h2>
                  <p className="text-[10px] text-white/40 mt-1">
                    {timer.formatTime(timer.elapsed)} elapsed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black italic text-white leading-none">
                    {overallPct}%
                  </p>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                    Complete
                  </p>
                </div>
              </div>

              {/* Overall progress bar */}
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full bg-[#39FF14] rounded-full"
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-[#39FF14]" />
                  <span className="text-[10px] text-white/50 font-bold">
                    {doneSets}/{totalSets} sets done
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer size={12} className="text-[#00F0FF]" />
                  <span className="text-[10px] text-white/50 font-bold">
                    {timer.formatTime(timer.elapsed)} elapsed
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame size={12} className="text-[#FF6B35]" />
                  <span className="text-[10px] text-white/50 font-bold">~612 kcal</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="mx-6 h-px bg-white/5" />

        {/* ── Exercise Blocks ──────────────────────────────────────────── */}
        <section className="px-6 mt-6">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between mb-4"
          >
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                Exercises
              </h2>
              <p className="text-[10px] text-white/30 mt-0.5">
                Tap to expand &middot; check off sets
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-[#39FF14] font-bold uppercase tracking-wider">
              <Activity size={11} />{' '}
              {blocks.filter((b) => b.sets.every((s) => s.status === 'done')).length}/
              {blocks.length} done
            </span>
          </motion.div>

          <div className="space-y-3">
            {blocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                onToggleExpand={toggleExpand}
                onToggleSet={toggleSet}
                onAddSet={addSet}
              />
            ))}
          </div>
        </section>

        {/* ── Session Notes ────────────────────────────────────────────── */}
        <section className="px-6 mt-6">
          <div className="mx-0 h-px bg-white/5 mb-6" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-bg-card border border-white/8 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-[#00F0FF]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                Session Notes
              </span>
            </div>
            <p className="text-xs text-white/40 italic leading-relaxed">
              Tap the mic to add voice notes during your session.
            </p>
            <button className="mt-3 text-[10px] text-[#39FF14] font-bold uppercase tracking-widest flex items-center gap-1">
              <Plus size={10} /> Add note
            </button>
          </motion.div>
        </section>

        {/* ── Finish CTA ──────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-[#39FF14]/20 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-[0_0_30px_rgba(57,255,20,0.05)]"
          >
            <div>
              <p className="text-[10px] text-[#39FF14] font-black uppercase tracking-widest mb-1">
                {overallPct === 100 ? 'Session Complete!' : 'Keep Going'}
              </p>
              <p className="text-sm font-black italic text-white leading-snug">
                {doneSets} of {totalSets} sets logged.{' '}
                <span className="text-white/50 not-italic font-normal">
                  {overallPct === 100
                    ? 'Great sim effort.'
                    : `${totalSets - doneSets} remaining.`}
                </span>
              </p>
            </div>
            {/* TODO: Save workout via POST /api/workouts */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex-shrink-0 bg-[#39FF14] text-black text-[11px] font-black uppercase tracking-widest px-5 py-3 rounded-xl shadow-[0_4px_20px_rgba(57,255,20,0.4)] flex items-center gap-1.5"
            >
              {overallPct === 100 ? (
                <>
                  <CheckCircle2 size={13} /> Done
                </>
              ) : (
                <>
                  <Zap size={11} /> Finish
                </>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Bottom spacer for voice controls */}
        <div className="h-48" />
      </div>

      {/* ── Voice Transcription Overlay ──────────────────────────────── */}
      <div className="absolute bottom-56 left-0 right-0 flex justify-center px-8 z-20">
        <AnimatePresence>
          {(isListening || voiceTranscript) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 max-w-sm"
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isListening
                    ? 'bg-[#39FF14] animate-pulse'
                    : voiceConfirmed
                      ? 'bg-[#39FF14]'
                      : 'bg-yellow-400 animate-pulse'
                }`}
              />
              <p className="text-sm font-medium text-white/80 italic">
                &ldquo;{voiceTranscript}&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Controls ─────────────────────────────────────────── */}
      <div className="pb-14 pt-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent flex-shrink-0 relative z-20">
        <div className="flex flex-col items-center gap-6">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleVoiceTap}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-[#39FF14] shadow-[0_0_40px_rgba(57,255,20,0.6)]'
                : 'bg-bg-card border border-white/10'
            }`}
            aria-label={isListening ? 'Stop recording' : 'Start voice log'}
            aria-pressed={isListening}
          >
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="off"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <MicOff size={36} className="text-black" />
                </motion.div>
              ) : (
                <motion.div
                  key="on"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Mic size={36} className="text-white/80" />
                </motion.div>
              )}
            </AnimatePresence>
            {isListening && (
              <div className="absolute inset-0 bg-[#39FF14]/20 rounded-full blur-2xl animate-pulse" />
            )}
          </motion.button>

          <AudioWaveform isActive={isListening} />

          <AnimatePresence>
            {voiceConfirmed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-[#39FF14]/20 flex items-center justify-center">
                  <CheckCircle2 size={11} className="text-[#39FF14]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#39FF14]">
                  Logged. Round 1 complete. Rest 2 mins.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scanlines overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-[100]"
        aria-hidden="true"
      />
    </motion.div>
  );
}
