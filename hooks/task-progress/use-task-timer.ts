import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseTaskTimerReturn {
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useTaskTimer(): UseTaskTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;

    clearTimerInterval();
    startTimeRef.current = Date.now() - pausedTimeRef.current * 1000;
    setIsRunning(true);
    setIsPaused(false);

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current !== null) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);

        // Log every full minute to verify timer is working
        if (elapsed > 0 && elapsed % 60 === 0) {
          console.log('[TaskTimer] Elapsed minutes:', elapsed / 60);
        }
      }
    }, 1000);
  }, [isRunning, clearTimerInterval]);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;

    clearTimerInterval();
    pausedTimeRef.current = elapsedSeconds;
    setIsRunning(false);
    setIsPaused(true);
  }, [isRunning, isPaused, elapsedSeconds, clearTimerInterval]);

  const resume = useCallback(() => {
    if (!isPaused || isRunning) return;

    start();
  }, [isPaused, isRunning, start]);

  const stop = useCallback(() => {
    clearTimerInterval();
    setIsRunning(false);
    setIsPaused(false);
    pausedTimeRef.current = 0;
    startTimeRef.current = null;
  }, [clearTimerInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  return {
    elapsedSeconds,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
  };
}
