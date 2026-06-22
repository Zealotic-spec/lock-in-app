import { useEffect, useState } from "react";

export interface TimerSettings {
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;
}

export const TIMER_DEFAULTS: TimerSettings = { workMin: 25, shortBreakMin: 5, longBreakMin: 15 };

const STORAGE_KEY = "lockin-timer-settings";
const MIN_MINUTES = 1;
const MAX_MINUTES = 180;

function clampMinutes(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));
}

function loadSettings(): TimerSettings {
  if (typeof window === "undefined") return TIMER_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return TIMER_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<TimerSettings>;
    return {
      workMin: clampMinutes(Number(parsed.workMin), TIMER_DEFAULTS.workMin),
      shortBreakMin: clampMinutes(Number(parsed.shortBreakMin), TIMER_DEFAULTS.shortBreakMin),
      longBreakMin: clampMinutes(Number(parsed.longBreakMin), TIMER_DEFAULTS.longBreakMin),
    };
  } catch {
    return TIMER_DEFAULTS;
  }
}

// Local-only preference (no server round trip needed) for the Focus Timer's
// work / short-break / long-break lengths. Persisted to localStorage so it
// sticks across reloads.
export function useTimerSettings() {
  const [settings, setSettings] = useState<TimerSettings>(loadSettings);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function setMinutes(key: keyof TimerSettings, value: number) {
    setSettings((s) => ({ ...s, [key]: clampMinutes(value, s[key]) }));
  }

  return { settings, setMinutes, MIN_MINUTES, MAX_MINUTES };
}
