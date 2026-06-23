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

export function phaseTotal(mode: TimerMode, sessionCount: number, s: { workMin: number; shortBreakMin: number; longBreakMin: number }) {
  if (mode === "work") return s.workMin * 60;
  return (sessionCount % 4 === 0 ? s.longBreakMin : s.shortBreakMin) * 60;
}

interface TimerState {
  mode: TimerMode;
  sessionCount: number;
  secondsLeft: number;
  running: boolean;
  taskId: string;
  habitId: string;
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;

  tick: () => void;
  setRunning: (v: boolean) => void;
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
      taskId: "",
      habitId: "",
      ...TIMER_DEFAULTS,

      tick: () => set((s) => ({ secondsLeft: Math.max(0, s.secondsLeft - 1) })),

      setRunning: (v) => set({ running: v }),

      setTaskId: (id) => set({ taskId: id }),
      setHabitId: (id) => set({ habitId: id }),

      setMinutes: (key, value) => {
        const s = get();
        const clamped = clampMin(value, s[key]);
        set({ [key]: clamped });
        // If paused, sync secondsLeft to the new duration
        if (!s.running) {
          set({ secondsLeft: phaseTotal(s.mode, s.sessionCount, { ...s, [key]: clamped }) });
        }
      },

      resetPhase: () => {
        const s = get();
        set({ running: false, mode: "work", secondsLeft: s.workMin * 60 });
      },

      goToBreak: (nextCount) => {
        const s = get();
        set({ mode: "break", sessionCount: nextCount, secondsLeft: phaseTotal("break", nextCount, s) });
      },

      goToWork: () => {
        const s = get();
        set({ mode: "work", secondsLeft: s.workMin * 60 });
      },
    }),
    {
      name: "lockin-timer",
      // Don't persist running — timer should be paused on page reload
      partialize: (s) => ({
        mode: s.mode,
        sessionCount: s.sessionCount,
        secondsLeft: s.secondsLeft,
        taskId: s.taskId,
        habitId: s.habitId,
        workMin: s.workMin,
        shortBreakMin: s.shortBreakMin,
        longBreakMin: s.longBreakMin,
      }),
    }
  )
);
