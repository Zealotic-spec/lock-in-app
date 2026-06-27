import { useMemo, useState, type ReactNode } from "react";
import { Flame, Percent, Clock3, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProductiveDayChart } from "@/components/ui/ProductiveDayChart";
import { GrowthAreaChart } from "@/components/ui/GrowthAreaChart";
import { Donut, DonutLegend } from "@/components/ui/Donut";
import { useStatsSummary, useDailyStats } from "@/hooks/useStats";
import { toISODate } from "@/lib/utils";

// 90 days covers day (30), week (12×7=84), and month (6) views
const STATS_FROM = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 89);
  return toISODate(d);
})();

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <Card className="text-center">
      <div className="mx-auto mb-1.5 text-accent w-fit">{icon}</div>
      <div className="stat-num text-[24px]">{value}</div>
      <div className="stat-label mt-1">{label}</div>
    </Card>
  );
}

type ChartView = "day" | "week" | "month";

interface ActivityPoint {
  label: string;
  tasks: number;
  habits: number;
  focusMins: number;
}

function buildDayPoints(byDate: Record<string, { tasks: number; habits: number; focusMins: number }>): ActivityPoint[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const iso = toISODate(d);
    const entry = byDate[iso] ?? { tasks: 0, habits: 0, focusMins: 0 };
    return {
      label: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      ...entry,
    };
  });
}

function buildWeekPoints(byDate: Record<string, { tasks: number; habits: number; focusMins: number }>): ActivityPoint[] {
  return Array.from({ length: 12 }, (_, i) => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Mon = 0
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek - (11 - i) * 7);
    monday.setHours(0, 0, 0, 0);
    const label = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    let tasks = 0, habits = 0, focusMins = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(monday);
      day.setDate(day.getDate() + d);
      const e = byDate[toISODate(day)];
      if (e) { tasks += e.tasks; habits += e.habits; focusMins += e.focusMins; }
    }
    return { label, tasks, habits, focusMins };
  });
}

function buildMonthPoints(
  stats: Array<{ date: string; tasksDone: number; habitsDone: number; focusMins: number }>,
): ActivityPoint[] {
  return Array.from({ length: 6 }, (_, i) => {
    const now = new Date();
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const label = monthDate.toLocaleDateString("en-US", { month: "short" });
    let tasks = 0, habits = 0, focusMins = 0;
    for (const s of stats) {
      if (s.date.slice(0, 7) === monthKey) {
        tasks += s.tasksDone;
        habits += s.habitsDone;
        focusMins += s.focusMins;
      }
    }
    return { label, tasks, habits, focusMins };
  });
}

export default function StatsPage() {
  const { data: summary, isLoading, isError, refetch } = useStatsSummary();
  const { data: rawStats } = useDailyStats(STATS_FROM, toISODate());

  const [chartView, setChartView] = useState<ChartView>("week");

  const activityPoints = useMemo<ActivityPoint[]>(() => {
    const stats = rawStats ?? [];
    const byDate: Record<string, { tasks: number; habits: number; focusMins: number }> = {};
    for (const s of stats) {
      byDate[s.date.slice(0, 10)] = {
        tasks: s.tasksDone,
        habits: s.habitsDone,
        focusMins: s.focusMins,
      };
    }
    if (chartView === "day") return buildDayPoints(byDate);
    if (chartView === "week") return buildWeekPoints(byDate);
    return buildMonthPoints(stats);
  }, [rawStats, chartView]);

  const tasksData = activityPoints.map((p) => ({ label: p.label, v: p.tasks }));
  const habitsData = activityPoints.map((p) => ({ label: p.label, v: p.habits }));
  const focusData = activityPoints.map((p) => ({ label: p.label, v: Math.round((p.focusMins / 60) * 10) / 10 }));

  if (isLoading) return <p className="text-muted text-sm">Loading…</p>;

  if (isError || !summary) {
    return (
      <Card className="max-w-md text-center py-8">
        <p className="text-[13.5px] text-danger mb-3">Couldn&rsquo;t load your stats. Check your connection and try again.</p>
        <button onClick={() => refetch()} className="btn btn-ghost">Retry</button>
      </Card>
    );
  }

  const completionRate = Math.round(summary.completionRate);
  const donutData = [
    { label: "Completed", value: completionRate, color: "#39FF14" },
    { label: "Missed", value: 100 - completionRate, color: "#2A2A2A" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={<Flame size={20} />} label="Best Streak" value={summary.bestStreak} />
        <StatTile icon={<Percent size={20} />} label="Completion" value={`${completionRate}%`} />
        <StatTile icon={<Clock3 size={20} />} label="Total Hours" value={summary.totalHours} />
        <StatTile icon={<CalendarDays size={20} />} label="Best Day" value={summary.bestDay} />
      </div>

      {/* Growth over time */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="screen-title text-[15px]">Growth over time</h2>
          <div className="flex gap-1.5">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`tag capitalize ${chartView === v ? "tag-green" : ""}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Tasks */}
          <div>
            <p className="eyebrow mb-2" style={{ color: "#39FF14" }}>Tasks done</p>
            <GrowthAreaChart data={tasksData} height={90} color="#39FF14" name="Tasks" unit="tasks" />
          </div>

          {/* Habits */}
          <div>
            <p className="eyebrow mb-2" style={{ color: "#64A8FF" }}>Habits done</p>
            <GrowthAreaChart data={habitsData} height={90} color="#64A8FF" name="Habits" unit="habits" />
          </div>

          {/* Focus */}
          <div>
            <p className="eyebrow mb-2" style={{ color: "#FF9500" }}>Focus hours</p>
            <GrowthAreaChart data={focusData} height={90} color="#FF9500" name="Focus" unit="h" showXAxis />
          </div>
        </div>
      </Card>

      {/* Productive day + Habit completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h2 className="screen-title text-[15px] mb-3">Most productive day</h2>
          <ProductiveDayChart data={summary.dayOfWeek} />
        </Card>

        <Card>
          <h2 className="screen-title text-[15px] mb-4">Habit completion</h2>
          <div className="flex items-center gap-6 flex-wrap">
            <Donut data={donutData} centerLabel={`${completionRate}%`} />
            <DonutLegend data={donutData} />
          </div>
        </Card>
      </div>

      {/* Breakdown */}
      <Card>
        <h2 className="screen-title text-[15px] mb-4">Breakdown</h2>
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="pr-4">
            <p className="eyebrow mb-2">This week</p>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="stat-num text-[22px]">{summary.thisWeek.tasks}</span>
              <span className="text-muted text-[12px]">tasks done</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="stat-num text-[22px]">{summary.thisWeek.hours}</span>
              <span className="text-muted text-[12px]">focus hours</span>
            </div>
          </div>
          <div className="pl-4">
            <p className="eyebrow mb-2">This month</p>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="stat-num text-[22px]">{summary.thisMonth.tasks}</span>
              <span className="text-muted text-[12px]">tasks done</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="stat-num text-[22px]">{summary.thisMonth.hours}</span>
              <span className="text-muted text-[12px]">focus hours</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
