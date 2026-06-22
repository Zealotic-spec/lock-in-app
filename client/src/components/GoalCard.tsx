import { ListChecks, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tag } from "@/components/ui/Tag";
import { formatDeadline } from "@/lib/utils";
import type { Goal } from "@/types";

const STATUS_LABEL: Record<Goal["status"], string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Card className="relative">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium truncate">{goal.title}</h3>
          {goal.description && <p className="text-[12.5px] text-muted mt-0.5 line-clamp-2">{goal.description}</p>}
        </div>
        <button className="text-muted-2 hover:text-white transition shrink-0" onClick={() => setMenuOpen((v) => !v)}>
          <MoreVertical size={16} />
        </button>
      </div>

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

      <div className="flex items-center justify-between mb-1.5">
        <Tag green={goal.status === "ACTIVE"}>{STATUS_LABEL[goal.status]}</Tag>
        <span className="text-[12px] font-mono text-muted">{goal.progress}%</span>
      </div>
      <ProgressBar pct={goal.progress} />

      <div className="flex items-center justify-between mt-3 text-[12px] text-muted-2">
        <span>{formatDeadline(goal.deadline)}</span>
        <span className="flex items-center gap-1.5 font-mono">
          <ListChecks size={13} />
          {goal.linkedTasksDone ?? 0}/{goal.linkedTasksCount ?? 0} tasks
        </span>
      </div>
    </Card>
  );
}
