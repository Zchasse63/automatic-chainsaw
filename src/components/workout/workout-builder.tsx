'use client';

import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  Search,
  Dumbbell,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useCreateWorkout } from '@/hooks/use-workouts';
import { useRouter } from 'next/navigation';

// ── Types ──

interface ExerciseEntry {
  id: string; // client-side key
  name: string;
  sets: number;
  reps: number | null;
  weight_kg: number | null;
  distance_m: number | null;
  duration_seconds: number | null;
}

const SESSION_TYPES = [
  { value: 'run', label: 'Run' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'strength', label: 'Strength' },
  { value: 'simulation', label: 'Hyrox Sim' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'station_practice', label: 'Station' },
  { value: 'general', label: 'General' },
];

// Common Hyrox-relevant exercises (client-side — no API call needed)
const COMMON_EXERCISES = [
  'SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump',
  'Rowing', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls',
  'Back Squat', 'Deadlift', 'Bench Press', 'Overhead Press',
  'Pull-ups', 'Push-ups', 'Box Jumps', 'Kettlebell Swings',
  'Running', 'Assault Bike', 'Jump Rope', 'Plank',
  'Romanian Deadlift', 'Bulgarian Split Squat', 'Goblet Squat',
  'Dumbbell Row', 'Hip Thrust', 'Calf Raises', 'Lateral Lunges',
  'Battle Ropes', 'Medicine Ball Slams', 'Treadmill Run',
];

interface WorkoutBuilderProps {
  open: boolean;
  onClose: () => void;
}

let nextId = 1;
function genId() {
  return `ex-${nextId++}`;
}

export function WorkoutBuilder({ open, onClose }: WorkoutBuilderProps) {
  const router = useRouter();
  const createWorkout = useCreateWorkout();

  const [sessionType, setSessionType] = useState('strength');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const addExercise = useCallback((name: string) => {
    setExercises((prev) => [
      ...prev,
      {
        id: genId(),
        name,
        sets: 3,
        reps: 10,
        weight_kg: null,
        distance_m: null,
        duration_seconds: null,
      },
    ]);
    setShowExercisePicker(false);
    setSearchQuery('');
  }, []);

  function removeExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function updateExercise(id: string, field: keyof ExerciseEntry, value: string | number | null) {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  async function handleSave(andStart: boolean) {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const result = await createWorkout.mutateAsync({
        date: today,
        session_type: sessionType,
        duration_minutes: duration ? Number(duration) : undefined,
        notes: notes || undefined,
        completed_workout: exercises.length > 0
          ? {
              exercises: exercises.map((e) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                weight_kg: e.weight_kg,
                distance_m: e.distance_m,
                duration_seconds: e.duration_seconds,
              })),
            }
          : undefined,
      });

      if (andStart && result.workout?.id) {
        router.push(`/workout/${result.workout.id}`);
      }
      onClose();
    } catch {
      // Error shown via createWorkout.error
    }
  }

  const filteredExercises = searchQuery
    ? COMMON_EXERCISES.filter((e) =>
        e.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COMMON_EXERCISES;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg max-h-[95vh] bg-[#0f0f0f] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5 flex-shrink-0">
            <h3 className="text-base font-black uppercase tracking-tighter">
              Create Workout
            </h3>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
            style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}
          >
            {/* Session Type */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block">
                Session Type
              </label>
              <div className="flex flex-wrap gap-2">
                {SESSION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setSessionType(t.value)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      sessionType === t.value
                        ? 'bg-[#39FF14] text-black'
                        : 'bg-white/5 text-white/40 hover:text-white border border-white/10'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#39FF14]/40 transition-colors"
              />
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Exercises
                </label>
                <span className="text-[10px] text-white/20">
                  {exercises.length} added
                </span>
              </div>

              {exercises.length === 0 ? (
                <div className="bg-white/3 rounded-xl p-6 text-center border border-dashed border-white/10">
                  <Dumbbell size={20} className="text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/20">
                    No exercises yet. Tap + to add.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-white/5 rounded-xl p-3 border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">
                          {ex.name}
                        </span>
                        <button
                          onClick={() => removeExercise(ex.id)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[8px] text-white/30 uppercase">
                            Sets
                          </label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={(e) =>
                              updateExercise(
                                ex.id,
                                'sets',
                                Number(e.target.value) || 1
                              )
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-[#39FF14]/40"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-white/30 uppercase">
                            Reps
                          </label>
                          <input
                            type="number"
                            value={ex.reps ?? ''}
                            onChange={(e) =>
                              updateExercise(
                                ex.id,
                                'reps',
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            placeholder="—"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-[#39FF14]/40 placeholder:text-white/15"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-white/30 uppercase">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            value={ex.weight_kg ?? ''}
                            onChange={(e) =>
                              updateExercise(
                                ex.id,
                                'weight_kg',
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            placeholder="—"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none focus:border-[#39FF14]/40 placeholder:text-white/15"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add exercise button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowExercisePicker(true)}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/10 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-[#39FF14] hover:border-[#39FF14]/30 transition-colors"
              >
                <Plus size={14} />
                Add Exercise
              </motion.button>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this workout..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#39FF14]/40 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Footer — Save buttons */}
          <div className="px-5 py-4 border-t border-white/5 flex-shrink-0 space-y-2">
            {createWorkout.isError && (
              <p className="text-xs text-red-400 text-center mb-1">
                {createWorkout.error?.message || 'Failed to create workout'}
              </p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSave(true)}
              disabled={createWorkout.isPending}
              className="w-full py-3 rounded-xl bg-[#39FF14] text-black text-xs font-black uppercase tracking-widest hover:bg-[#39FF14]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createWorkout.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Save & Start'
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSave(false)}
              disabled={createWorkout.isPending}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
            >
              Save Only
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Exercise picker overlay */}
      {showExercisePicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-[90] flex items-end sm:items-center justify-center"
          onClick={() => {
            setShowExercisePicker(false);
            setSearchQuery('');
          }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[70vh] bg-[#0f0f0f] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col"
          >
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
                <Search size={14} className="text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exercises..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto px-2 pb-4"
              style={{ scrollbarWidth: 'none' }}
            >
              {filteredExercises.map((name) => (
                <button
                  key={name}
                  onClick={() => addExercise(name)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  {name}
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-xs text-white/20">No exercises found</p>
                  {searchQuery && (
                    <button
                      onClick={() => addExercise(searchQuery)}
                      className="mt-2 text-xs text-[#39FF14] hover:underline"
                    >
                      Add &quot;{searchQuery}&quot; as custom exercise
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
