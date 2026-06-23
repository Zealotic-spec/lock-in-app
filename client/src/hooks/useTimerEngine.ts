import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timer";
import { useHabits, useLogHabit } from "@/hooks/useHabits";
import { useLogFocusSession } from "@/hooks/useStats";
import { sounds } from "@/lib/sounds";
import { toISODate } from "@/lib/utils";

/**
 * Drives the timer countdown and phase transitions.
 * Must be rendered exactly once at the app root (AppShell) so it keeps
 * ticking regardless of which page the user is on.
 */
export function useTimerEngine() {
  const running = useTimerStore((s) => s.running);
  const secondsLeft = useTimerStore((s) => s.secondsLeft);
  const tick = useTimerStore((s) => s.tick);
  const goToBreak = useTimerStore((s) => s.goToBreak);
  const goToWork = useTimerStore((s) => s.goToWork);

  const { data: habits } = useHabits();
  const logFocus = useLogFocusSession();
  const logHabit = useLogHabit();

  // Keep a stable ref to the store so phase-advance doesn't need stale deps.
  const storeRef = useRef(useTimerStore.getState());
  useEffect(() => useTimerStore.subscribe((s) => { storeRef.current = s; }), []);
  const habitsRef = useRef(habits);
  useEffect(() => { habitsRef.current = habits; }, [habits]);

  useEffect(() => {
    if (!running) return;

    if (secondsLeft <= 0) {
      const s = storeRef.current;

      if (s.mode === "work") {
        // Log focus minutes
        logFocus.mutate(s.workMin);

        // Auto-check linked habit if not already done today
        if (s.habitId) {
          const today = toISODate();
          const habit = habitsRef.current?.find((h) => h.id === s.habitId);
          const alreadyDone = habit?.logs?.some((l) => l.date.slice(0, 10) === today && l.completed);
          if (!alreadyDone) logHabit.mutate({ id: s.habitId, date: today, completed: true });
        }

        sounds.timerEnd();
        goToBreak(s.sessionCount + 1);
      } else {
        sounds.breakEnd();
        goToWork();
      }
      return;
    }

    const id = setTimeout(tick, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, secondsLeft]);
}
