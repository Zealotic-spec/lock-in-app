import { useState } from "react";
import { Plus, Trash2, CheckSquare } from "lucide-react";
import { TrackingTask } from "./types";
import { DAY_LABELS, getTodayGraphIndex } from "./storage";

interface TaskManagerProps {
  tasks: TrackingTask[];
  weekKey: string;
  onChange: (tasks: TrackingTask[]) => void;
}

export default function TaskManager({ tasks, weekKey, onChange }: TaskManagerProps) {
  const [draft, setDraft] = useState("");
  const todayIdx = getTodayGraphIndex();

  const addTask = () => {
    const text = draft.trim();
    if (!text) return;
    const task: TrackingTask = {
      id: Date.now(),
      text,
      createdAt: Date.now(),
      weekKey,
      checks: Array(7).fill(false),
    };
    onChange([task, ...tasks]);
    setDraft("");
  };

  const toggleCheck = (id: number, dayIdx: number) => {
    onChange(
      tasks.map(t =>
        t.id === id
          ? { ...t, checks: t.checks.map((v, i) => (i === dayIdx ? !v : v)) }
          : t
      )
    );
  };

  const deleteTask = (id: number) => {
    onChange(tasks.filter(t => t.id !== id));
  };

  const totalDone = tasks.reduce((sum, t) => sum + t.checks.filter(Boolean).length, 0);
  const totalSlots = tasks.length * 7;

  return (
    <div className="tracking-card theme-transition">
      <div className="tracking-card-title">
        <span className="flex items-center gap-2">
          <CheckSquare size={14} /> Привычки недели
        </span>
        <span className="text-[var(--accent)] normal-case font-extrabold">
          {totalDone}/{totalSlots} отмечено
        </span>
      </div>

      <div className="tracking-add-row">
        <input
          className="tracking-input"
          placeholder="Новая задача на неделю..."
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

      {tasks.length === 0 ? (
        <p className="text-xs text-[var(--muted)] italic text-center py-4">Задач пока нет</p>
      ) : (
        <div className="tracking-week-table">
          <div className="tracking-week-head">
            <span className="tracking-week-head-spacer" />
            <span className="tracking-week-head-checks">
              {DAY_LABELS.map((label, idx) => (
                <span
                  key={label}
                  className={`tracking-week-head-day ${idx === todayIdx ? "today" : ""}`}
                >
                  {label}
                </span>
              ))}
            </span>
            <span className="tracking-week-head-spacer" />
          </div>

          {tasks.map(t => {
            const doneCount = t.checks.filter(Boolean).length;
            return (
              <div key={t.id} className={`tracking-task-row ${doneCount === 7 ? "done" : ""}`}>
                <span className="tracking-task-text">{t.text}</span>
                <span className="tracking-task-checks">
                  {DAY_LABELS.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      data-label={label}
                      className={`tracking-day-check ${t.checks[idx] ? "checked" : ""} ${
                        idx === todayIdx ? "today" : ""
                      }`}
                      onClick={() => toggleCheck(t.id, idx)}
                      aria-label={`${t.text} — ${label}`}
                      aria-pressed={t.checks[idx]}
                    />
                  ))}
                </span>
                <button className="tracking-task-del" onClick={() => deleteTask(t.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
