'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'workout-timer-';

export function useWorkoutTimer(workoutId: string) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workoutId}`);
    if (saved) {
      const { startTime, savedElapsed, running } = JSON.parse(saved);
      if (running && startTime) {
        startTimeRef.current = startTime;
        setIsRunning(true);
      } else if (savedElapsed) {
        setElapsed(savedElapsed);
      }
    }
  }, [workoutId]);

  const tick = useCallback(() => {
    if (startTimeRef.current) {
      const now = Date.now();
      setElapsed(now - startTimeRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isRunning) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, tick]);

  // Persist to localStorage
  useEffect(() => {
    if (isRunning) {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${workoutId}`,
        JSON.stringify({ startTime: startTimeRef.current, running: true })
      );
    }
  }, [elapsed, isRunning, workoutId]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now() - elapsed;
    setIsRunning(true);
  }, [elapsed]);

  const stop = useCallback(() => {
    setIsRunning(false);
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${workoutId}`,
      JSON.stringify({ savedElapsed: elapsed, running: false })
    );
  }, [elapsed, workoutId]);

  const reset = useCallback(() => {
    setElapsed(0);
    setIsRunning(false);
    startTimeRef.current = null;
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${workoutId}`);
  }, [workoutId]);

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  return { elapsed, isRunning, start, stop, reset, formatTime };
}
