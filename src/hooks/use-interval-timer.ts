'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ── Timer Modes ───────────────────────────────────────────

export type TimerMode = 'stopwatch' | 'countdown' | 'interval' | 'emom' | 'amrap' | 'tabata';

export interface TimerConfig {
  mode: TimerMode;
  /** Total seconds for countdown/AMRAP */
  totalSeconds?: number;
  /** Work seconds for interval/Tabata */
  workSeconds?: number;
  /** Rest seconds for interval/Tabata */
  restSeconds?: number;
  /** Number of rounds for interval. Tabata is always 8. */
  rounds?: number;
  /** EMOM interval in seconds (usually 60) */
  emomInterval?: number;
  /** Total EMOM rounds */
  emomRounds?: number;
}

export interface TimerState {
  /** Elapsed ms for stopwatch, remaining ms for countdown modes */
  displayMs: number;
  isRunning: boolean;
  /** Current round (1-indexed) */
  currentRound: number;
  totalRounds: number;
  /** 'work' | 'rest' for interval modes */
  phase: 'work' | 'rest';
  /** Whether the timer has completed */
  isComplete: boolean;
  /** Total elapsed ms since start (for logging) */
  totalElapsed: number;
}

const DEFAULT_CONFIG: TimerConfig = { mode: 'stopwatch' };

const TABATA_WORK = 20;
const TABATA_REST = 10;
const TABATA_ROUNDS = 8;

// ── Hook ──────────────────────────────────────────────────

export function useIntervalTimer(initialConfig?: TimerConfig) {
  const [config, setConfig] = useState<TimerConfig>(initialConfig ?? DEFAULT_CONFIG);
  const [state, setState] = useState<TimerState>({
    displayMs: 0,
    isRunning: false,
    currentRound: 1,
    totalRounds: 1,
    phase: 'work',
    isComplete: false,
    totalElapsed: 0,
  });

  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const beepRef = useRef<(() => void) | null>(null);

  // Audio beep
  useEffect(() => {
    if (typeof window === 'undefined') return;
    beepRef.current = () => {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        // Haptic
        if (navigator.vibrate) navigator.vibrate(100);
      } catch {
        // Audio not available
      }
    };
  }, []);

  const beep = useCallback(() => beepRef.current?.(), []);

  // ── Tick logic ────────────────────────────────────────────

  const tick = useCallback(() => {
    const now = performance.now();
    const rawElapsed = accumulatedRef.current + (now - startTimeRef.current);

    setState((prev) => {
      if (!prev.isRunning || prev.isComplete) return prev;

      const totalElapsed = rawElapsed;

      switch (config.mode) {
        case 'stopwatch': {
          return { ...prev, displayMs: rawElapsed, totalElapsed };
        }

        case 'countdown': {
          const totalMs = (config.totalSeconds ?? 60) * 1000;
          const remaining = Math.max(0, totalMs - rawElapsed);
          if (remaining <= 0) {
            beep();
            return { ...prev, displayMs: 0, isRunning: false, isComplete: true, totalElapsed };
          }
          return { ...prev, displayMs: remaining, totalElapsed };
        }

        case 'amrap': {
          const totalMs = (config.totalSeconds ?? 600) * 1000;
          const remaining = Math.max(0, totalMs - rawElapsed);
          if (remaining <= 0) {
            beep();
            return { ...prev, displayMs: 0, isRunning: false, isComplete: true, totalElapsed };
          }
          return { ...prev, displayMs: remaining, totalElapsed };
        }

        case 'emom': {
          const intervalMs = (config.emomInterval ?? 60) * 1000;
          const totalRounds = config.emomRounds ?? 10;
          const totalMs = intervalMs * totalRounds;
          if (rawElapsed >= totalMs) {
            beep();
            return { ...prev, displayMs: 0, isRunning: false, isComplete: true, currentRound: totalRounds, totalRounds, totalElapsed };
          }
          const currentRound = Math.floor(rawElapsed / intervalMs) + 1;
          const intoRound = rawElapsed % intervalMs;
          const remaining = intervalMs - intoRound;
          // Beep on round transitions
          if (currentRound !== prev.currentRound) beep();
          return { ...prev, displayMs: remaining, currentRound, totalRounds, totalElapsed };
        }

        case 'interval':
        case 'tabata': {
          const workMs = ((config.mode === 'tabata' ? TABATA_WORK : config.workSeconds) ?? 30) * 1000;
          const restMs = ((config.mode === 'tabata' ? TABATA_REST : config.restSeconds) ?? 15) * 1000;
          const totalRounds = config.mode === 'tabata' ? TABATA_ROUNDS : (config.rounds ?? 8);
          const cycleMs = workMs + restMs;
          const totalMs = cycleMs * totalRounds;

          if (rawElapsed >= totalMs) {
            beep();
            return { ...prev, displayMs: 0, isRunning: false, isComplete: true, currentRound: totalRounds, totalRounds, totalElapsed };
          }

          const currentRound = Math.floor(rawElapsed / cycleMs) + 1;
          const intoCycle = rawElapsed % cycleMs;
          const phase = intoCycle < workMs ? 'work' as const : 'rest' as const;
          const remaining = phase === 'work' ? workMs - intoCycle : cycleMs - intoCycle;

          // Beep on phase transitions
          if (phase !== prev.phase || currentRound !== prev.currentRound) beep();

          return { ...prev, displayMs: remaining, currentRound, totalRounds, phase, totalElapsed };
        }

        default:
          return prev;
      }
    });

    rafRef.current = requestAnimationFrame(tick);
  }, [config, beep]);

  useEffect(() => {
    if (state.isRunning && !state.isComplete) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state.isRunning, state.isComplete, tick]);

  // ── Controls ──────────────────────────────────────────────

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
    setState((prev) => ({
      ...prev,
      isRunning: true,
      isComplete: false,
    }));
  }, []);

  const pause = useCallback(() => {
    accumulatedRef.current += performance.now() - startTimeRef.current;
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resume = useCallback(() => {
    startTimeRef.current = performance.now();
    setState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const reset = useCallback(() => {
    accumulatedRef.current = 0;
    startTimeRef.current = 0;
    const totalRounds = config.mode === 'tabata'
      ? TABATA_ROUNDS
      : config.mode === 'emom'
        ? (config.emomRounds ?? 10)
        : (config.rounds ?? 8);
    setState({
      displayMs: config.mode === 'stopwatch' ? 0 : (config.totalSeconds ?? 60) * 1000,
      isRunning: false,
      currentRound: 1,
      totalRounds,
      phase: 'work',
      isComplete: false,
      totalElapsed: 0,
    });
  }, [config]);

  const configure = useCallback((newConfig: TimerConfig) => {
    setConfig(newConfig);
    accumulatedRef.current = 0;
    startTimeRef.current = 0;
    const totalRounds = newConfig.mode === 'tabata'
      ? TABATA_ROUNDS
      : newConfig.mode === 'emom'
        ? (newConfig.emomRounds ?? 10)
        : (newConfig.rounds ?? 8);
    setState({
      displayMs: newConfig.mode === 'stopwatch' ? 0 : (newConfig.totalSeconds ?? 60) * 1000,
      isRunning: false,
      currentRound: 1,
      totalRounds,
      phase: 'work',
      isComplete: false,
      totalElapsed: 0,
    });
  }, []);

  // ── Format ────────────────────────────────────────────────

  const formatDisplay = useCallback((ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  return {
    config,
    state,
    start,
    pause,
    resume,
    reset,
    configure,
    formatDisplay,
  };
}
