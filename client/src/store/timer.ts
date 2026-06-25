import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TimerMode = "work" | "break";

export const TIMER_DEFAULTS = { workMin: 25, shortBreakMin: 5, longBreakMin: 15 };
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 180;

export function clampMin(v: number, fallback: number) {
  if (!Number.isFinite(v)) return fallback;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(v)));
}

export function phaseTotal(
  mode: TimerMode,
  sessionCount: number,
  s: { workMin: number; shortBreakMin: number; longBreakMin: number }
) {
  if (mode === "work") return s.workMin * 60;
  return (sessionCount % 4 === 0 ? s.longBreakMin : s.shortBreakMin) * 60;
}

interface TimerState {
  mode: TimerMode;
  sessionCount: number;
  /** Remaining seconds — kept in sync by the engine every 200ms when running. */
  secondsLeft: number;
  running: boolean;
  /** Timestamp (ms) when the current run started. Used to compute real elapsed
   *  time so background throttling doesn't desync the clock. */
  startedAt: number | null;
  /** secondsLeft captured at the moment startedAt was set.
   *  The engine computes: secondsLeftAtStart - floor((now - startedAt) / 1000)
   *  so elapsed is never double-subtracted from an already-decremented counter. */
  secondsLeftAtStart: number | null;
  taskId: string;
  habitId: string;
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;

  setRunning: (v: boolean) => void;
  setSecondsLeft: (v: number) => void;
  setTaskId: (id: string) => void;
  setHabitId: (id: string) => void;
  setMinutes: (key: "workMin" | "shortBreakMin" | "longBreakMin", value: number) => void;
  resetPhase: () => void;
  goToBreak: (nextCount: number) => void;
  goToWork: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      mode: "work",
      sessionCount: 0,
      secondsLeft: TIMER_DEFAULTS.workMin * 60,
      running: false,
      startedAt: null,
      secondsLeftAtStart: null,
      taskId: "",
      habitId: "",
      ...TIMER_DEFAULTS,

      setRunning: (v) => {
        if (v) {
          const s = get();
          set({ running: true, startedAt: Date.now(), secondsLeftAtStart: s.secondsLeft });
        } else {
          const s = get();
          const elapsed = s.startedAt
            ? Math.floor((Date.now() - s.startedAt) / 1000)
            : 0;
          const base = s.secondsLeftAtStart ?? s.secondsLeft;
          const remaining = Math.max(0, base - elapsed);
          set({ running: false, startedAt: null, secondsLeftAtStart: null, secondsLeft: remaining });
        }
      },

      setSecondsLeft: (v) => set({ secondsLeft: v }),

      setTaskId: (id) => set({ taskId: id }),
      setHabitId: (id) => set({ habitId: id }),

      setMinutes: (key, value) => {
        const s = get();
        const clamped = clampMin(value, s[key]);
        set({ [key]: clamped });
        if (!s.running) {
          set({ secondsLeft: phaseTotal(s.mode, s.sessionCount, { ...s, [key]: clamped }) });
        }
      },

      resetPhase: () => {
        const s = get();
        set({ running: false, startedAt: null, secondsLeftAtStart: null, mode: "work", sessionCount: 0, secondsLeft: s.workMin * 60 });
      },

      goToBreak: (nextCount) => {
        const s = get();
        const newSeconds = phaseTotal("break", nextCount, s);
        set({
          mode: "break",
          sessionCount: nextCount,
          secondsLeft: newSeconds,
          secondsLeftAtStart: newSeconds,
          startedAt: Date.now(),
        });
      },

      goToWork: () => {
        const s = get();
        const newSeconds = s.workMin * 60;
        set({ mode: "work", secondsLeft: newSeconds, secondsLeftAtStart: newSeconds, startedAt: Date.now() });
      },
    }),
    {
      name: "lockin-timer",
      partialize: (s) => ({
        mode: s.mode,
        sessionCount: s.sessionCount,
        secondsLeft: s.secondsLeft,
        taskId: s.taskId,
        habitId: s.habitId,
        workMin: s.workMin,
        shortBreakMin: s.shortBreakMin,
        longBreakMin: s.longBreakMin,
        startedAt: s.startedAt,
        secondsLeftAtStart: s.secondsLeftAtStart,
        running: s.running,
      }),
    }
  )
);
