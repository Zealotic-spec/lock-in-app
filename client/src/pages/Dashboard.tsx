import { Link } from "react-router-dom";
import { Flame, ListChecks, Clock3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MiniBarChart } from "@/components/ui/MiniBarChart";
import { HabitCheckRow } from "@/components/ui/HabitCheckRow";
import { useHabits, useLogHabit } from "@/hooks/useHabits";
import { useGoals } from "@/hooks/useGoals";
import { useDailyStats, useStatsSummary } from "@/hooks/useStats";
import { formatDeadline, lastNDays, toISODate } from "@/lib/utils";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardPage() {
  const today = toISODate();
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: summary, isError: summaryError, refetch: refetchSummary } = useStatsSummary();
  const weekDays = lastNDays(7);
  const { data: dailyStats } = useDailyStats(weekDays[0], weekDays[6]);
  const logHabit = useLogHabit();

  const todayLogged = (habit: { logs?: { date: string; completed: boolean }[] }) =>
    habit.logs?.some((l) => l.date.slice(0, 10) === today && l.completed) ?? false;

  const activeGoals = (goals ?? []).filter((g) => g.status === "ACTIVE").slice(0, 3);

  const focusByDate: Record<string, number> = {};
  for (const s of dailyStats ?? []) focusByDate[s.date.slice(0, 10)] = s.focusMins;
  const weekChart = weekDays.map((d) => ({
    d: DAY_LABELS[(new Date(d).getDay() + 6) % 7],
    v: Math.round(((focusByDate[d] ?? 0) / 60) * 10) / 10,
  }));

  return (
    <div className="flex flex-col gap-5">
      {summaryError && (
        <Card className="flex items-center justify-between gap-3 py-3">
          <p className="text-[13px] text-danger">Couldn&rsquo;t load your stats.</p>
          <button onClick={() => refetchSummary()} className="text-[12.5px] text-accent hover:underline shrink-0">
            Retry
          </button>
        </Card>
      )}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <ListChecks className="mx-auto mb-1.5 text-accent" size={20} />
          <div className="stat-num text-[28px]">{summary?.totals.tasks ?? "—"}</div>
          <div className="stat-label mt-1">Tasks Done</div>
        </Card>
        <Card className="text-center">
          <Flame className="mx-auto mb-1.5 text-accent" size={20} />
          <div className="stat-num text-[28px]">{summary?.totals.streak ?? "—"}</div>
          <div className="stat-label mt-1">Best Streak</div>
        </Card>
        <Card className="text-center">
          <Clock3 className="mx-auto mb-1.5 text-accent" size={20} />
          <div className="stat-num text-[28px]">{summary?.totals.hours ?? "—"}</div>
          <div className="stat-label mt-1">Focus Hours</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h2 className="screen-title text-[15px]">Today&rsquo;s habits</h2>
              <Link to="/habits" className="text-[12.5px] text-accent hover:underline">
                View all
              </Link>
            </div>
            {habitsLoading && <p className="text-muted text-sm py-3">Loading…</p>}
            {!habitsLoading && (habits?.length ?? 0) === 0 && (
              <p className="text-muted text-sm py-3">
                No habits yet.{" "}
                <Link to="/habits" className="text-accent hover:underline">
                  Add your first one
                </Link>
                .
              </p>
            )}
            {habits?.slice(0, 6).map((h) => (
              <HabitCheckRow
                key={h.id}
                title={h.title}
                meta={`${h.streak} day streak`}
                done={todayLogged(h)}
                onToggle={() => logHabit.mutate({ id: h.id, date: today, completed: !todayLogged(h) })}
              />
            ))}
          </Card>

          <Card>
            <h2 className="screen-title text-[15px] mb-3">This week&rsquo;s focus</h2>
            <MiniBarChart data={weekChart} />
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="screen-title text-[15px]">Active goals</h2>
              <Link to="/goals" className="text-[12.5px] text-accent hover:underline">
                View all
              </Link>
            </div>
            {goalsLoading && <p className="text-muted text-sm py-2">Loading…</p>}
            {!goalsLoading && activeGoals.length === 0 && <p className="text-muted text-sm py-2">No active goals yet.</p>}
            <div className="flex flex-col gap-4">
              {activeGoals.map((g) => (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13.5px] font-medium truncate pr-2">{g.title}</span>
                    <span className="text-[12px] font-mono text-muted shrink-0">{g.progress}%</span>
                  </div>
                  <ProgressBar pct={g.progress} />
                  <p className="text-[11.5px] text-muted-2 mt-1">{formatDeadline(g.deadline)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="text-center py-6">
            <p className="font-mono text-[12px] text-muted-2 mb-1">DAILY REMINDER</p>
            <p className="screen-title text-[17px]">Discipline beats motivation. Lock in.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
