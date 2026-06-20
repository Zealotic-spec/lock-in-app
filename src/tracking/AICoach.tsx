import { useState } from "react";
import { Sparkles, Download, Trash2, KeyRound, Loader2, CalendarRange } from "lucide-react";
import { WeeklyReport, MonthlyReport, DayMetric } from "./types";
import {
  getGeminiApiKey,
  setGeminiApiKey,
  saveWeeklyReport,
  loadWeeklyReports,
  saveMonthlyReport,
  weeklyReportsForMonth,
  getCurrentMonthKey,
  downloadReport,
  clearTrackingData,
  summarizeDays,
} from "./storage";
import { generateWeeklyAnalysis, generateMonthlyAnalysis } from "./gemini";

interface AICoachProps {
  weekKey: string;
  days: DayMetric[];
  onCleared: () => void;
}

export default function AICoach({ weekKey, days, onCleared }: AICoachProps) {
  const [apiKey, setApiKeyState] = useState(getGeminiApiKey());
  const [keyVisible, setKeyVisible] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [error, setError] = useState("");
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(
    () => loadWeeklyReports()[weekKey] || null
  );
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const saveKey = (val: string) => {
    setApiKeyState(val);
    setGeminiApiKey(val);
  };

  const runWeeklyAnalysis = async () => {
    setError("");
    if (!apiKey) {
      setError("Сначала добавьте Gemini API-ключ.");
      return;
    }
    setLoadingWeekly(true);
    try {
      const aiSummary = await generateWeeklyAnalysis(weekKey, days);
      const totals = summarizeDays(days);
      const report: WeeklyReport = {
        weekKey,
        generatedAt: Date.now(),
        days,
        aiSummary,
        ...totals,
      };
      saveWeeklyReport(report);
      setWeeklyReport(report);
      setMonthlyReport(null);
    } catch (e: any) {
      setError(e?.message || "Не удалось получить анализ от Gemini.");
    } finally {
      setLoadingWeekly(false);
    }
  };

  const runMonthlyRollup = async () => {
    setError("");
    if (!apiKey) {
      setError("Сначала добавьте Gemini API-ключ.");
      return;
    }
    const monthKey = getCurrentMonthKey();
    const weeks = weeklyReportsForMonth(monthKey);
    if (weeks.length === 0) {
      setError("Нет ни одного сформированного недельного анализа за этот месяц.");
      return;
    }
    setLoadingMonthly(true);
    try {
      const aiSummary = await generateMonthlyAnalysis(monthKey, weeks);
      const totals = weeks.reduce(
        (acc, w) => ({
          totalFocusMinutes: acc.totalFocusMinutes + w.totalFocusMinutes,
          totalSessions: acc.totalSessions + w.totalSessions,
          totalTasksCompleted: acc.totalTasksCompleted + w.totalTasksCompleted,
        }),
        { totalFocusMinutes: 0, totalSessions: 0, totalTasksCompleted: 0 }
      );
      const report: MonthlyReport = {
        monthKey,
        generatedAt: Date.now(),
        weekKeys: weeks.map(w => w.weekKey),
        aiSummary,
        ...totals,
      };
      saveMonthlyReport(report);
      setMonthlyReport(report);
    } catch (e: any) {
      setError(e?.message || "Не удалось получить месячный отчёт от Gemini.");
    } finally {
      setLoadingMonthly(false);
    }
  };

  const handleDownload = (format: "json" | "txt") => {
    const report = monthlyReport || weeklyReport;
    if (!report) return;
    const isMonthly = !!monthlyReport;
    const key = isMonthly ? (report as MonthlyReport).monthKey : (report as WeeklyReport).weekKey;
    if (format === "json") {
      downloadReport(`lockin-report-${key}.json`, JSON.stringify(report, null, 2), "application/json");
    } else {
      const lines = [
        `LOCK IN — Отчёт о продуктивности (${key})`,
        `Сгенерирован: ${new Date(report.generatedAt).toLocaleString("ru-RU")}`,
        `Фокус-минут: ${report.totalFocusMinutes}`,
        `Сессий: ${report.totalSessions}`,
        `Задач выполнено: ${report.totalTasksCompleted}`,
        "",
        "── Анализ AI Coach ──",
        report.aiSummary,
      ];
      downloadReport(`lockin-report-${key}.txt`, lines.join("\n"), "text/plain");
    }
  };

  const handleClear = () => {
    clearTrackingData();
    setWeeklyReport(null);
    setMonthlyReport(null);
    setConfirmClear(false);
    onCleared();
  };

  return (
    <div className="tracking-card theme-transition">
      <div className="tracking-card-title">
        <span className="flex items-center gap-2">
          <Sparkles size={14} /> AI Coach · Gemini
        </span>
      </div>
      <p className="text-[10px] text-[var(--muted)] -mt-2 mb-1 leading-relaxed">
        Анализирует данные сразу из Analytics (фокус-сессии таймера) и Tracking (привычки недели).
      </p>

      <div className="ai-coach-panel">
        <div>
          <label className="text-[10px] font-extrabold text-[var(--muted)] tracking-wide uppercase mb-2 flex items-center gap-1">
            <KeyRound size={11} /> Gemini API Key
          </label>
          <div className="ai-key-row">
            <input
              className="tracking-input"
              type={keyVisible ? "text" : "password"}
              placeholder="AIza..."
              value={apiKey}
              onChange={e => saveKey(e.target.value)}
            />
            <button className="ai-btn ghost" onClick={() => setKeyVisible(v => !v)}>
              {keyVisible ? "Скрыть" : "Показать"}
            </button>
          </div>
          <p className="text-[10px] text-[var(--muted)] mt-2 leading-relaxed">
            Ключ хранится только в localStorage этого браузера и используется исключительно
            для прямых запросов к Gemini API. Никуда больше не передаётся.
          </p>
        </div>

        {error && <p className="text-xs text-[#ff3b30] font-semibold">{error}</p>}

        <div className="ai-action-row">
          <button className="ai-btn" onClick={runWeeklyAnalysis} disabled={loadingWeekly}>
            {loadingWeekly ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Анализ недели
          </button>
          <button className="ai-btn ghost" onClick={runMonthlyRollup} disabled={loadingMonthly}>
            {loadingMonthly ? <Loader2 size={14} className="animate-spin" /> : <CalendarRange size={14} />}
            Месячный отчёт
          </button>
        </div>

        {(weeklyReport || monthlyReport) && (
          <div className="ai-summary-box theme-transition">
            {monthlyReport ? monthlyReport.aiSummary : weeklyReport?.aiSummary}
          </div>
        )}

        {(weeklyReport || monthlyReport) && (
          <div className="ai-action-row">
            <button className="ai-btn ghost" onClick={() => handleDownload("json")}>
              <Download size={13} /> .json
            </button>
            <button className="ai-btn ghost" onClick={() => handleDownload("txt")}>
              <Download size={13} /> .txt
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-[var(--border)]">
          {!confirmClear ? (
            <button className="ai-btn danger w-full justify-center" onClick={() => setConfirmClear(true)}>
              <Trash2 size={13} /> Очистить данные за месяц
            </button>
          ) : (
            <div className="flex gap-2">
              <button className="ai-btn danger flex-1 justify-center" onClick={handleClear}>
                Подтвердить удаление
              </button>
              <button className="ai-btn ghost flex-1 justify-center" onClick={() => setConfirmClear(false)}>
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
