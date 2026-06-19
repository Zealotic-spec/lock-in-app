import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DayMetric } from "./types";

interface WeeklyAnalyticsProps {
  days: DayMetric[];
  colorTheme: string;
}

// Recharts рисует SVG, поэтому цвета читаем как реальные computed-значения
// CSS-переменных текущей темы (а не строкой "var(--accent)") — это надёжно
// работает во всех webview-движках (WebView2/WKWebView), которые использует Tauri.
function useCssVar(varName: string, theme: string, fallback: string): string {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (v) setValue(v);
  }, [varName, theme]);
  return value;
}

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bar-tooltip-box" style={{ position: "static", transform: "none" }}>
      <div className="btt-day">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between text-xs gap-4">
          <span className="text-[var(--muted)]">{p.name}:</span>
          <span className="font-extrabold text-[var(--text)]">
            {p.value}
            {unit || ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function WeeklyAnalytics({ days, colorTheme }: WeeklyAnalyticsProps) {
  const accent = useCssVar("--accent", colorTheme, "#6366f1");
  const secondary = useCssVar("--accent-secondary", colorTheme, "#a855f7");
  const muted = useCssVar("--muted", colorTheme, "#71717a");
  const border = useCssVar("--border", colorTheme, "rgba(255,255,255,0.08)");

  const axisStyle = { fontSize: 11, fontWeight: 700, fill: muted };

  return (
    <>
      <div className="tracking-chart-card theme-transition">
        <div className="tracking-chart-title">Распределение фокуса по дням (мин)</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={days} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke={border} vertical={false} />
            <XAxis dataKey="dayLabel" tick={axisStyle} axisLine={{ stroke: border }} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={34} />
            <Tooltip content={<ChartTooltip unit=" мин" />} cursor={{ fill: border }} />
            <Area
              type="monotone"
              dataKey="focusMinutes"
              name="Фокус"
              stroke={accent}
              fill={accent}
              fillOpacity={0.22}
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="tracking-chart-card theme-transition">
        <div className="tracking-chart-title">Фокус-сессии по дням</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={days} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke={border} vertical={false} />
            <XAxis dataKey="dayLabel" tick={axisStyle} axisLine={{ stroke: border }} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip content={<ChartTooltip unit=" сессий" />} cursor={{ fill: border }} />
            <Bar dataKey="sessions" name="Сессии" fill={secondary} radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="tracking-chart-card theme-transition">
        <div className="tracking-chart-title">Выполненные задачи за 7 дней</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={days} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke={border} vertical={false} />
            <XAxis dataKey="dayLabel" tick={axisStyle} axisLine={{ stroke: border }} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip content={<ChartTooltip unit=" задач" />} cursor={{ stroke: accent, strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="tasksCompleted"
              name="Задачи"
              stroke={accent}
              strokeWidth={2.5}
              dot={{ r: 4, fill: accent }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
