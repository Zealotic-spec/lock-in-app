// ─── ИНТЕГРАЦИЯ С GEMINI (@google/genai) ДЛЯ AI COACH ────────────────────
// Ключ API вводится пользователем и хранится только в localStorage (см. storage.ts).
// Запросы идут напрямую из браузера/Tauri webview к Gemini API — без серверного
// посредника, в полном соответствии с принципом "вся обработка данных — локально".

import { GoogleGenAI } from "@google/genai";
import { DayMetric, WeeklyReport } from "./types";
import { getGeminiApiKey } from "./storage";

const MODEL = "gemini-2.5-flash";

function buildClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API-ключ не задан. Добавьте его в разделе AI Coach.");
  }
  return new GoogleGenAI({ apiKey });
}

function formatDaysForPrompt(days: DayMetric[]): string {
  return days
    .map(
      d =>
        `${d.dayLabel}: ${d.focusMinutes} мин фокуса, ${d.sessions} сессий, ${d.tasksCompleted} задач выполнено`
    )
    .join("\n");
}

export async function generateWeeklyAnalysis(weekKey: string, days: DayMetric[]): Promise<string> {
  const ai = buildClient();
  const prompt = [
    "Ты — персональный AI-коуч продуктивности в приложении LOCK IN.",
    `Вот данные пользователя за неделю ${weekKey} (по дням, Пн-Вс):`,
    formatDaysForPrompt(days),
    "",
    "Кратко (не больше 180 слов), на русском языке:",
    "1. Назови 2-3 сильные стороны недели.",
    "2. Назови 1-2 главные ошибки/провала и почему они произошли.",
    "3. Дай один конкретный, выполнимый совет на следующую неделю.",
    "Пиши тёпло, но по делу, без воды и общих фраз.",
  ].join("\n");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text?.trim() || "Не удалось получить ответ от модели.";
}

interface WeeklySummaryForRollup
  extends Pick<WeeklyReport, "weekKey" | "aiSummary" | "totalFocusMinutes" | "totalTasksCompleted"> {}

export async function generateMonthlyAnalysis(
  monthKey: string,
  weeklySummaries: WeeklySummaryForRollup[]
): Promise<string> {
  const ai = buildClient();
  const weeksBlock = weeklySummaries
    .map(
      w =>
        `Неделя ${w.weekKey} — ${w.totalFocusMinutes} мин, ${w.totalTasksCompleted} задач.\nАнализ: ${w.aiSummary}`
    )
    .join("\n\n");

  const prompt = [
    "Ты — персональный AI-коуч продуктивности в приложении LOCK IN.",
    `Собери месячный отчёт за ${monthKey} на основе еженедельных анализов:`,
    weeksBlock,
    "",
    "Сформируй итоговый «Месячный отчёт о продуктивности» на русском языке (200-300 слов):",
    "— Общая динамика по неделям (рост/падение фокуса).",
    "— Главное достижение месяца.",
    "— Главная системная проблема месяца.",
    "— 2-3 рекомендации на следующий месяц.",
  ].join("\n");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text?.trim() || "Не удалось получить ответ от модели.";
}
