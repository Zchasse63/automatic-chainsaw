'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Dumbbell, Clock, Flame, FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateWorkout } from '@/hooks/use-workouts';
import { getSessionInfo, formatSessionType } from '@/lib/session-utils';
import { formatDateLabel } from '@/lib/calendar-utils';

const SESSION_TYPES = [
  'run',
  'hiit',
  'strength',
  'simulation',
  'station_practice',
  'recovery',
] as const;

interface QuickAddModalProps {
  dateKey: string | null; // YYYY-MM-DD or null (closed)
  onClose: () => void;
}

export function QuickAddModal({ dateKey, onClose }: QuickAddModalProps) {
  const queryClient = useQueryClient();
  const [sessionType, setSessionType] = useState<string>('run');
  const [duration, setDuration] = useState('45');
  const [rpe, setRpe] = useState('6');
  const [notes, setNotes] = useState('');

  const resetForm = useCallback(() => {
    setSessionType('run');
    setDuration('45');
    setRpe('6');
    setNotes('');
  }, []);

  // Reset form whenever the modal opens for a new date
  useEffect(() => {
    if (dateKey) resetForm();
  }, [dateKey, resetForm]);

  const createWorkoutMutation = useCreateWorkout();

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(() => {
    if (!dateKey) return;
    createWorkoutMutation.mutate(
      {
        date: dateKey,
        session_type: sessionType,
        duration_minutes: Number(duration) || undefined,
        rpe_post: Number(rpe) || undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          // Also invalidate calendar-data (not in the shared hook)
          queryClient.invalidateQueries({ queryKey: ['calendar-data'] });
          resetForm();
          onClose();
        },
      }
    );
  }, [dateKey, createWorkoutMutation, sessionType, duration, rpe, notes, queryClient, resetForm, onClose]);

  return (
    <AnimatePresence>
      {dateKey && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto"
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mt-3 mb-2" />

            <div className="px-6 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black italic tracking-tighter uppercase text-white">
                    Log Workout
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {formatDateLabel(dateKey)}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Session Type Picker */}
              <div className="mb-5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block">
                  Session Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SESSION_TYPES.map((type) => {
                    const info = getSessionInfo(type);
                    const Icon = info.icon;
                    const isSelected = sessionType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setSessionType(type)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-[#39FF14]/40 bg-[#39FF14]/5'
                            : 'border-white/5 bg-white/3 hover:border-white/10'
                        }`}
                      >
                        <Icon
                          size={18}
                          style={{ color: isSelected ? info.color : 'rgba(255,255,255,0.3)' }}
                        />
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isSelected ? 'text-white' : 'text-white/40'
                          }`}
                        >
                          {formatSessionType(type)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div className="mb-5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                  <Clock size={12} /> Duration (minutes)
                </label>
                <div className="flex gap-2">
                  {['30', '45', '60', '75', '90'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setDuration(val)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        duration === val
                          ? 'border-[#39FF14]/40 bg-[#39FF14]/5 text-white'
                          : 'border-white/5 bg-white/3 text-white/40 hover:border-white/10'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* RPE */}
              <div className="mb-5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                  <Flame size={12} /> RPE (1-10)
                </label>
                <div className="flex gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((val) => (
                    <button
                      key={val}
                      onClick={() => setRpe(val)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                        rpe === val
                          ? 'border-[#39FF14]/40 bg-[#39FF14]/5 text-white'
                          : 'border-white/5 bg-white/3 text-white/30 hover:border-white/10'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                  <FileText size={12} /> Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tempo Run 8km, Sled Push Intervals..."
                  rows={2}
                  className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-[#39FF14]/30 transition-colors"
                />
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSubmit}
                disabled={createWorkoutMutation.isPending}
                className="w-full bg-[#39FF14] text-black text-sm font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_4px_20px_rgba(57,255,20,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Dumbbell size={16} />
                {createWorkoutMutation.isPending ? 'Saving...' : 'Log Workout'}
              </motion.button>

              {createWorkoutMutation.isError && (
                <p className="text-red-400 text-xs text-center mt-3">
                  {createWorkoutMutation.error?.message || 'Failed to save workout'}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
