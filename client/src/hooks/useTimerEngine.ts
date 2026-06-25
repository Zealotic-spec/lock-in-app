import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timer";
import { useHabits, useLogHabit } from "@/hooks/useHabits";
import { useLogFocusSession } from "@/hooks/useStats";
import { sounds } from "@/lib/sounds";
import { sendNotification } from "@/lib/notify";
import { toISODate } from "@/lib/utils";

/**
 * Drives the timer.  Lives in AppShell so it keeps running on every page.
 *
 * Why timestamp-based?
 * Chrome throttles setTimeout/setInterval in background tabs to ~1 per minute.
 * Instead of decrementing a counter we store `startedAt` and compute
 * `secondsLeft = secondsAtStart - floor((now - startedAt) / 1000)`.
 * Even if the interval fires late, the displayed time is always accurate.
 * visibilitychange gives an immediate sync the moment the user switches back.
 */
export function useTimerEngine() {
  const setSecondsLeft = useTimerStore((s) => s.setSecondsLeft);
  const goToBreak = useTimerStore((s) => s.goToBreak);
  const goToWork = useTimerStore((s) => s.goToWork);

  const { data: habits } = useHabits();
  const logFocus = useLogFocusSession();
  const logHabit = useLogHabit();

  // Stable refs so callbacks never go stale
  const habitsRef = useRef(habits);
  useEffect(() => { habitsRef.current = habits; }, [habits]);

  // Keep track of whether advancePhase already fired for this zero crossing
  // (the interval might fire multiple times at secondsLeft === 0 before the
  // store update propagates).
  const advancingRef = useRef(false);

  useEffect(() => {
    function computeAndSync(): number {
      const s = useTimerStore.getState();
      if (!s.running || s.startedAt === null) return s.secondsLeft;
      const elapsed = Math.floor((Date.now() - s.startedAt) / 1000);
      const base = s.secondsLeftAtStart ?? s.secondsLeft;
      return Math.max(0, base - elapsed);
    }

    function advancePhase() {
      if (advancingRef.current) return;
      advancingRef.current = true;

      const s = useTimerStore.getState();

      if (s.mode === "work") {
        logFocus.mutate(s.workMin);

        if (s.habitId) {
          const today = toISODate();
          const habit = habitsRef.current?.find((h) => h.id === s.habitId);
          const alreadyDone = habit?.logs?.some((l) => l.date.slice(0, 10) === today && l.completed);
          if (!alreadyDone) logHabit.mutate({ id: s.habitId, date: today, completed: true });
        }

        sounds.timerEnd();
        sendNotification(
          "Focus session complete! 🎉",
          "Great work — time to take a break."
        );
        goToBreak(s.sessionCount + 1);
      } else {
        sounds.breakEnd();
        sendNotification(
          "Break over — lock back in 🔒",
          "Your next focus session is ready."
        );
        goToWork();
      }

      // Reset guard after store update settles
      setTimeout(() => { advancingRef.current = false; }, 500);
    }

    function tick() {
      const s = useTimerStore.getState();
      if (!s.running || s.startedAt === null) return;

      const computed = computeAndSync();
      setSecondsLeft(computed);

      if (computed <= 0) advancePhase();
    }

    // Poll every 200ms — fast enough for smooth display, cheap enough for battery.
    const interval = setInterval(tick, 200);

    // Immediately sync when the user switches back to the tab (Chrome may have
    // suspended our interval for minutes while in background).
    function onVisibility() {
      if (!document.hidden) tick();
    }
    document.addEventListener("visibilitychange", onVisibility);

    // Also sync on focus (e.g. Alt-Tab back to the browser window)
    window.addEventListener("focus", tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
