import { useState } from "react";
import { Plus, Trash2, Flag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useGoals } from "@/hooks/useGoals";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { sounds } from "@/lib/sounds";
import type { Priority, Task } from "@/types";

const PRIORITY_COLOR: Record<Priority, string> = {
  HIGH: "#ff4444",
  MEDIUM: "#f5a623",
  LOW: "#39ff14",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

function TaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-border last:border-0 group ${task.isDone ? "opacity-50" : ""}`}>
      <button
        onClick={onToggle}
        aria-label={task.isDone ? "Mark incomplete" : "Mark complete"}
        className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all ${
          task.isDone ? "bg-accent border-accent" : "border-border hover:border-accent"
        }`}
      />
      <span className={`flex-1 text-[14px] truncate ${task.isDone ? "line-through text-muted-2" : ""}`}>
        {task.title}
      </span>
      {task.dueDate && (
        <span className="text-[11px] text-muted-2 font-mono shrink-0">
          {new Date(task.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
        </span>
      )}
      <Flag size={13} className="shrink-0" style={{ color: PRIORITY_COLOR[task.priority] }} aria-label={PRIORITY_LABEL[task.priority]} />
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition text-muted-2 hover:text-danger shrink-0"
        aria-label="Delete task"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: goals } = useGoals();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const confirmDelete = useConfirm();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [goalId, setGoalId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    sounds.add();
    createTask.mutate(
      {
        title: title.trim(),
        priority,
        goalId: goalId || null,
        dueDate: dueDate || null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDueDate("");
          setGoalId("");
          setPriority("MEDIUM");
        },
      }
    );
  }

  const filtered = (tasks ?? []).filter((t) => {
    if (filter === "active") return !t.isDone;
    if (filter === "done") return t.isDone;
    return true;
  });

  const doneCount = (tasks ?? []).filter((t) => t.isDone).length;
  const totalCount = (tasks ?? []).length;

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Card>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <Input
            placeholder="Add a new task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
          />
          <div className="flex gap-2 flex-wrap">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="flex-1 min-w-[110px]">
              <option value="LOW">Low priority</option>
              <option value="MEDIUM">Medium priority</option>
              <option value="HIGH">High priority</option>
            </Select>
            <Select value={goalId} onChange={(e) => setGoalId(e.target.value)} className="flex-1 min-w-[140px]">
              <option value="">No goal linked</option>
              {(goals ?? [])
                .filter((g) => g.status === "ACTIVE")
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
            </Select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 min-w-[140px] bg-[#141414] border border-border rounded-[10px] px-3 py-2 text-[13px] text-white outline-none transition focus:border-accent"
            />
            <Button type="submit" size="mini" disabled={!title.trim() || createTask.isPending}>
              <Plus size={14} /> Add
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["active", "done", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`tag capitalize ${filter === f ? "tag-green" : ""}`}
            >
              {f === "active" ? "To-do" : f === "done" ? "Done" : "All"}
            </button>
          ))}
        </div>
        <span className="text-[12px] font-mono text-muted-2">
          {doneCount}/{totalCount} done
        </span>
      </div>

      <Card>
        {isLoading && <p className="text-muted text-sm py-3">Loading…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-muted text-sm py-3 text-center">
            {filter === "active" ? "No pending tasks. Add one above." : "No tasks here yet."}
          </p>
        )}
        {filtered.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={() => {
              task.isDone ? sounds.taskUndone() : sounds.taskDone();
              updateTask.mutate({ id: task.id, input: { isDone: !task.isDone } });
            }}
            onDelete={async () => {
              const ok = await confirmDelete({
                title: "Delete this task?",
                message: `"${task.title}" will be removed for good.`,
                confirmText: "Delete",
                variant: "danger",
              });
              if (ok) { sounds.del(); deleteTask.mutate(task.id); }
            }}
          />
        ))}
      </Card>
    </div>
  );
}
