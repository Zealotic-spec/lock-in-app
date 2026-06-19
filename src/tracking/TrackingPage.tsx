import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { TrackingTask } from "./types";
import { loadTrackingTasks, saveTrackingTasks, buildWeekMetrics, getISOWeekKey } from "./storage";
import TaskManager from "./TaskManager";
import WeeklyAnalytics from "./WeeklyAnalytics";
import AICoach from "./AICoach";

interface TrackingPageProps {
  colorTheme: string;
}

export default function TrackingPage({ colorTheme }: TrackingPageProps) {
  const [tasks, setTasks] = useState<TrackingTask[]>(() => loadTrackingTasks());
  const weekKey = useMemo(() => getISOWeekKey(new Date()), []);

  useEffect(() => {
    saveTrackingTasks(tasks);
  }, [tasks]);

  const days = useMemo(() => buildWeekMetrics(weekKey, tasks), [weekKey, tasks]);

  const handleCleared = () => {
    setTasks([]);
  };

  return (
    <div className="tracking-layout w-full">
      <h2 className="tracking-title">
        <BarChart3 size={22} className="text-[var(--accent)]" /> TRACKING
      </h2>
      <p className="tracking-subtitle">
        Отдельный таск-менеджер, недельная аналитика и AI Coach на базе Gemini
      </p>

      <div className="tracking-grid">
        <div className="tracking-col">
          <TaskManager tasks={tasks} onChange={setTasks} />
          <AICoach weekKey={weekKey} days={days} onCleared={handleCleared} />
        </div>
        <div className="tracking-col">
          <WeeklyAnalytics days={days} colorTheme={colorTheme} />
        </div>
      </div>
    </div>
  );
}
