import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Heatmap } from "@/components/ui/Heatmap";
import { HabitCard } from "@/components/HabitCard";
import { HabitModal } from "@/components/HabitModal";
import { useCreateHabit, useDeleteHabit, useHabits, useLogHabit, useUpdateHabit } from "@/hooks/useHabits";
import { toISODate } from "@/lib/utils";
import type { Habit } from "@/types";

export default function HabitsPage() {
  const { data: habits, isLoading } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const logHabit = useLogHabit();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const today = toISODate();

  const countByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of habits ?? []) {
      for (const log of h.logs ?? []) {
        if (!log.completed) continue;
        const key = log.date.slice(0, 10);
        map[key] = (map[key] ?? 0) + 1;
      }
    }
    return map;
  }, [habits]);

  function pctFor(h: Habit) {
    const days = 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const count = (h.logs ?? []).filter((l) => l.completed && new Date(l.date) >= cutoff).length;
    const denom = h.frequency === "DAILY" ? days : Math.ceil(days / 7);
    return Math.min(100, Math.round((count / denom) * 100));
  }

  function doneToday(h: Habit) {
    return h.logs?.some((l) => l.date.slice(0, 10) === today && l.completed) ?? false;
  }

  function handleSubmit(input: { title: string; color: string; frequency: "DAILY" | "WEEKLY" }) {
    if (editing) {
      updateHabit.mutate({ id: editing.id, input }, { onSuccess: () => setModalOpen(false) });
    } else {
      createHabit.mutate(input, { onSuccess: () => setModalOpen(false) });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="screen-title text-[15px] mb-3">Consistency heatmap</h2>
        <Heatmap countByDate={countByDate} weeks={26} />
        <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-2 font-mono">
          <span>Less</span>
          <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#161616", border: "1px solid #1f1f1f" }} />
          <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "rgba(57,255,20,.22)" }} />
          <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "rgba(57,255,20,.45)" }} />
          <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "rgba(57,255,20,.72)" }} />
          <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#39FF14", boxShadow: "0 0 6px rgba(57,255,20,.6)" }} />
          <span>More</span>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="screen-title text-[17px]">Your habits</h2>
        <Button
          size="mini"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={14} /> Add habit
        </Button>
      </div>

      {isLoading && <p className="text-muted text-sm">Loading…</p>}
      {!isLoading && (habits?.length ?? 0) === 0 && (
        <Card className="text-center py-8">
          <p className="text-muted text-sm">No habits yet. Create your first one to start your streak.</p>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {habits?.map((h) => (
          <HabitCard
            key={h.id}
            habit={h}
            pct={pctFor(h)}
            doneToday={doneToday(h)}
            onCheckin={() => logHabit.mutate({ id: h.id, date: today, completed: !doneToday(h) })}
            onEdit={() => {
              setEditing(h);
              setModalOpen(true);
            }}
            onDelete={() => {
              if (confirm(`Delete "${h.title}"? This removes all of its logs.`)) deleteHabit.mutate(h.id);
            }}
          />
        ))}
      </div>

      <HabitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        submitting={createHabit.isPending || updateHabit.isPending}
      />
    </div>
  );
}
