import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Ring } from "@/components/ui/Ring";
import type { Habit } from "@/types";
import { toISODate } from "@/lib/utils";

export function HabitCard({
  habit,
  pct,
  doneToday,
  onCheckin,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  pct: number;
  doneToday: boolean;
  onCheckin: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Card className="relative flex flex-col items-center text-center gap-3">
      <button
        className="absolute top-3 right-3 text-muted-2 hover:text-white transition"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Habit options"
      >
        <MoreVertical size={16} />
      </button>
      {menuOpen && (
        <div className="absolute top-9 right-3 z-10 card p-1 min-w-[120px] shadow-lg">
          <button
            className="flex items-center gap-2 w-full text-left px-2.5 py-2 text-[13px] rounded-md hover:bg-surface-2 transition"
            onClick={() => {
              setMenuOpen(false);
              onEdit();
            }}
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            className="flex items-center gap-2 w-full text-left px-2.5 py-2 text-[13px] rounded-md hover:bg-surface-2 text-danger transition"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      <Ring pct={pct} size={84} sw={8} color={habit.color}>
        <span className="stat-num text-[18px]">{pct}%</span>
      </Ring>

      <div className="min-w-0 w-full">
        <p className="text-[14.5px] font-medium truncate">{habit.title}</p>
        <p className="text-[11.5px] text-muted-2 font-mono mt-0.5">
          {habit.streak} day streak · {habit.frequency === "DAILY" ? "Daily" : "Weekly"}
        </p>
      </div>

      <button className={`checkin ${doneToday ? "checkin-done" : ""}`} onClick={onCheckin}>
        {doneToday ? "Checked in" : "Check in"}
      </button>
    </Card>
  );
}

export function todayKey() {
  return toISODate();
}
