// ─── ХРАНИЛИЩЕ МОДУЛЯ "TRACKING" ──────────────────────────────────────────
// Всё, что ниже, работает исключительно с localStorage (требование "вся обработка
// данных трекинга — локально"). Существующие ключи App.tsx (lockin_*) читаются
// здесь ТОЛЬКО на чтение (история сессий) — ничего в них не пишется и не меняется.

import {
  TrackingTask,
  DayMetric,
  WeeklyReport,
  MonthlyReport,
  WeeklyReportMap,
  MonthlyReportMap,
} from "./types";

const KEY_TASKS = "lockin_tracking_tasks";
const KEY_WEEKLY = "lockin_tracking_weekly_reports";
const KEY_MONTHLY = "lockin_tracking_monthly_reports";
const KEY_GEMINI_KEY = "lockin_gemini_api_key";
const KEY_MAIN_HISTORY = "lockin_history"; // тот же ключ, что использует App.tsx

export const DAY_LABELS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

function ls<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* no-op */
  }
}

// ─── ISO-НЕДЕЛЯ ───────────────────────────────────────────────────────────
// Логика идентична getISOWeekKey/getTodayGraphIndex из App.tsx, продублирована
// как чистая функция здесь, чтобы не трогать и не экспортировать внутренности
// существующего компонента (жёсткое требование "логику не менять").
export function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

export function getTodayGraphIndex(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Обратная операция: восстанавливает дату четверга ISO-недели по её ключу
function isoWeekKeyToThursday(weekKey: string): Date {
  const [yearStr, weekStr] = weekKey.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const thursday = new Date(week1Monday);
  thursday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7 + 3);
  return thursday;
}

export function weekKeyToMonthKey(weekKey: string): string {
  const t = isoWeekKeyToThursday(weekKey);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ─── ЗАДАЧИ ТРЕКЕРА (независимый список от "Today's Focus") ────────────────
export function loadTrackingTasks(): TrackingTask[] {
  return ls<TrackingTask[]>(KEY_TASKS, []);
}
export function saveTrackingTasks(tasks: TrackingTask[]) {
  lsSet(KEY_TASKS, tasks);
}

// ─── ЧТЕНИЕ ИСТОРИИ СЕССИЙ (read-only) ───────────────────────────────────
interface MainHistoryItem {
  minutes: number;
  graphDayIndex: number;
  weekKey: string;
}
function loadMainHistory(): MainHistoryItem[] {
  return ls<MainHistoryItem[]>(KEY_MAIN_HISTORY, []);
}

// ─── АГРЕГАЦИЯ МЕТРИК ПО ДНЯМ ВЫБРАННОЙ НЕДЕЛИ ───────────────────────────
// Фокус-минуты и сессии — из настоящей истории таймера (lockin_history),
// выполненные задачи — из собственного таск-менеджера трекера (по completedAt).
export function buildWeekMetrics(weekKey: string, tasks: TrackingTask[]): DayMetric[] {
  const history = loadMainHistory().filter(h => h.weekKey === weekKey);

  const days: DayMetric[] = DAY_LABELS.map((label, idx) => ({
    dayIndex: idx,
    dayLabel: label,
    focusMinutes: 0,
    sessions: 0,
    tasksCompleted: 0,
  }));

  history.forEach(h => {
    const idx = h.graphDayIndex;
    if (idx >= 0 && idx < 7) {
      days[idx].focusMinutes += h.minutes || 0;
      days[idx].sessions += 1;
    }
  });

  tasks.forEach(t => {
    if (!t.completed || !t.completedAt) return;
    if (getISOWeekKey(new Date(t.completedAt)) !== weekKey) return;
    const jsDay = new Date(t.completedAt).getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    days[idx].tasksCompleted += 1;
  });

  return days;
}

export function summarizeDays(days: DayMetric[]) {
  return days.reduce(
    (acc, d) => ({
      totalFocusMinutes: acc.totalFocusMinutes + d.focusMinutes,
      totalSessions: acc.totalSessions + d.sessions,
      totalTasksCompleted: acc.totalTasksCompleted + d.tasksCompleted,
    }),
    { totalFocusMinutes: 0, totalSessions: 0, totalTasksCompleted: 0 }
  );
}

// ─── ОТЧЁТЫ: ХРАНЕНИЕ ────────────────────────────────────────────────────
export function loadWeeklyReports(): WeeklyReportMap {
  return ls<WeeklyReportMap>(KEY_WEEKLY, {});
}
export function saveWeeklyReport(report: WeeklyReport) {
  const all = loadWeeklyReports();
  all[report.weekKey] = report;
  lsSet(KEY_WEEKLY, all);
}

export function loadMonthlyReports(): MonthlyReportMap {
  return ls<MonthlyReportMap>(KEY_MONTHLY, {});
}
export function saveMonthlyReport(report: MonthlyReport) {
  const all = loadMonthlyReports();
  all[report.monthKey] = report;
  lsSet(KEY_MONTHLY, all);
}

// Все сохранённые недельные отчёты, относящиеся к указанному месяцу
export function weeklyReportsForMonth(monthKey: string): WeeklyReport[] {
  const all = loadWeeklyReports();
  return Object.values(all)
    .filter(r => weekKeyToMonthKey(r.weekKey) === monthKey)
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey));
}

// ─── GEMINI API KEY (только локально, никуда не передаётся) ──────────────
export function getGeminiApiKey(): string {
  return ls<string>(KEY_GEMINI_KEY, "");
}
export function setGeminiApiKey(key: string) {
  lsSet(KEY_GEMINI_KEY, key);
}

// ─── ПОЛНАЯ ОЧИСТКА ДАННЫХ TRACKING (не трогает таймер/дневник/идеи/историю) ─
export function clearTrackingData() {
  localStorage.removeItem(KEY_TASKS);
  localStorage.removeItem(KEY_WEEKLY);
  localStorage.removeItem(KEY_MONTHLY);
}

// ─── ЭКСПОРТ ОТЧЁТА В ФАЙЛ (.json / .txt), ЧИСТЫЙ BROWSER API ────────────
export function downloadReport(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
