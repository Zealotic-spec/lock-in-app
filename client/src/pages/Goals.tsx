import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GrowthAreaChart } from "@/components/ui/GrowthAreaChart";
import { GoalCard } from "@/components/GoalCard";
import { GoalModal } from "@/components/GoalModal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from "@/hooks/useGoals";
import { useDailyStats } from "@/hooks/useStats";
import { lastNDays } from "@/lib/utils";
import type { Goal } from "@/types";

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const confirmDelete = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const range = lastNDays(98); // 14 weeks
  const { data: dailyStats } = useDailyStats(range[0], range[range.length - 1]);

  const growthData = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const s of dailyStats ?? []) byDate[s.date.slice(0, 10)] = s.tasksDone;
    const weeks: { label: string; v: number }[] = [];
    for (let w = 0; w < 14; w++) {
      const slice = range.slice(w * 7, w * 7 + 7);
      const sum = slice.reduce((acc, d) => acc + (byDate[d] ?? 0), 0);
      weeks.push({ label: `W${w + 1}`, v: sum });
    }
    return weeks;
  }, [dailyStats, range]);

  function handleSubmit(input: Parameters<typeof createGoal.mutate>[0]) {
    if (editing) {
      updateGoal.mutate({ id: editing.id, input }, { onSuccess: () => setModalOpen(false) });
    } else {
      createGoal.mutate(input, { onSuccess: () => setModalOpen(false) });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="screen-title text-[15px] mb-1">Your growth</h2>
        <p className="text-[12px] text-muted-2 mb-2">Tasks completed per week, last 14 weeks</p>
        <GrowthAreaChart data={growthData} />
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="screen-title text-[17px]">Goals</h2>
        <Button
          size="mini"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={14} /> Add goal
        </Button>
      </div>

      {isLoading && <p className="text-muted text-sm">Loading…</p>}
      {!isLoading && (goals?.length ?? 0) === 0 && (
        <Card className="text-center py-8">
          <p className="text-muted text-sm">No goals yet. Set your first target.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {goals?.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onEdit={() => {
              setEditing(g);
              setModalOpen(true);
            }}
            onDelete={async () => {
              const ok = await confirmDelete({
                title: "Delete this goal?",
                message: `"${g.title}" will be removed for good.`,
                confirmText: "Delete",
                variant: "danger",
              });
              if (ok) deleteGoal.mutate(g.id);
            }}
          />
        ))}
      </div>

      <GoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        submitting={createGoal.isPending || updateGoal.isPending}
      />
    </div>
  );
}
