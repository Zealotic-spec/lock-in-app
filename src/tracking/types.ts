// ─── ТИПЫ МОДУЛЯ "TRACKING" ──────────────────────────────────────────────
// Полностью аддитивный файл: ничего из src/types.ts не меняется и не переиспользуется
// напрямую — модуль Tracking держит собственное доменное пространство имён,
// чтобы не задевать логику существующих фич (таймер/задачи/дневник/история).

// checks[0..6] = ПН..ВС текущей ISO-недели (weekKey). При смене недели чек-лист
// сбрасывается (см. loadTrackingTasks в storage.ts) — текст задачи сохраняется,
// это привычка "повторяющаяся задача на неделю", а не одноразовый to-do.
export interface TrackingTask {
  id: number;
  text: string;
  createdAt: number;
  weekKey: string;
  checks: boolean[];
}

export interface DayMetric {
  dayIndex: number;   // 0 = ПН ... 6 = ВС (тот же порядок, что и DAYS в App.tsx)
  dayLabel: string;   // "ПН", "ВТ", ...
  focusMinutes: number;
  sessions: number;
  tasksCompleted: number;
}

export interface WeeklyReport {
  weekKey: string;        // ISO-неделя, например "2026-W25"
  generatedAt: number;
  totalFocusMinutes: number;
  totalSessions: number;
  totalTasksCompleted: number;
  days: DayMetric[];
  aiSummary: string;      // текст от Gemini: сильные стороны / ошибки недели
}

export interface MonthlyReport {
  monthKey: string;       // "2026-06"
  generatedAt: number;
  weekKeys: string[];
  totalFocusMinutes: number;
  totalSessions: number;
  totalTasksCompleted: number;
  aiSummary: string;      // объединённый месячный анализ от Gemini
}

export type WeeklyReportMap = Record<string, WeeklyReport>;
export type MonthlyReportMap = Record<string, MonthlyReport>;
