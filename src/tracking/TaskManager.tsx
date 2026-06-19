import { useState } from "react";
import { Plus, Trash2, CheckSquare } from "lucide-react";
import { TrackingTask } from "./types";

interface TaskManagerProps {
  tasks: TrackingTask[];
  onChange: (tasks: TrackingTask[]) => void;
}

export default function TaskManager({ tasks, onChange }: TaskManagerProps) {
  const [draft, setDraft] = useState("");

  const addTask = () => {
    const text = draft.trim();
    if (!text) return;
    const task: TrackingTask = { id: Date.now(), text, completed: false, createdAt: Date.now() };
    onChange([task, ...tasks]);
    setDraft("");
  };

  const toggleTask = (id: number) => {
    onChange(
      tasks.map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined }
          : t
      )
    );
  };

  const deleteTask = (id: number) => {
    onChange(tasks.filter(t => t.id !== id));
  };

  const remaining = tasks.filter(t => !t.completed).length;

  return (
    <div className="tracking-card theme-transition">
      <div className="tracking-card-title">
        <span className="flex items-center gap-2">
          <CheckSquare size={14} /> Таск-менеджер трекера
        </span>
        <span className="text-[var(--accent)] normal-case font-extrabold">{remaining} активно</span>
      </div>

      <div className="tracking-add-row">
        <input
          className="tracking-input"
          placeholder="Новая задача..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") addTask();
          }}
        />
        <button className="ai-btn" onClick={addTask}>
          <Plus size={14} />
        </button>
      </div>

      <div className="flex flex-col">
        {tasks.length === 0 && (
          <p className="text-xs text-[var(--muted)] italic text-center py-4">Задач пока нет</p>
        )}
        {tasks.map(t => (
          <div key={t.id} className={`tracking-task-row ${t.completed ? "done" : ""}`}>
            <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} />
            <span className="tracking-task-text">{t.text}</span>
            <button className="tracking-task-del" onClick={() => deleteTask(t.id)}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
