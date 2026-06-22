import type { ReactNode } from "react";
import { Flame, Percent, Clock3, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProductiveDayChart } from "@/components/ui/ProductiveDayChart";
import { Donut, DonutLegend } from "@/components/ui/Donut";
import { useStatsSummary } from "@/hooks/useStats";

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <Card className="text-center">
      <div className="mx-auto mb-1.5 text-accent w-fit">{icon}</div>
      <div className="stat-num text-[24px]">{value}</div>
      <div className="stat-label mt-1">{label}</div>
    </Card>
  );
}

export default function StatsPage() {
  const { data: summary, isLoading, isError, refetch } = useStatsSummary();

  if (isLoading) {
    return <p className="text-muted text-sm">Loading…</p>;
  }

  if (isError || !summary) {
    return (
      <Card className="max-w-md text-center py-8">
        <p className="text-[13.5px] text-danger mb-3">Couldn&rsquo;t load your stats. Check your connection and try again.</p>
        <button onClick={() => refetch()} className="btn btn-ghost">
          Retry
        </button>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={<Flame size={20} />} label="Best Streak" value={summary.bestStreak} />
        <StatTile icon={<Percent size={20} />} label="Completion" value={`${completionRate}%`} />
        <StatTile icon={<Clock3 size={20} />} label="Total Hours" value={summary.totalHours} />
        <StatTile icon={<CalendarDays size={20} />} label="Best Day" value={summary.bestDay} />
      </div>

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
