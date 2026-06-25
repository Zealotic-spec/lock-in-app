import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Ring } from "@/components/ui/Ring";
import { Select } from "@/components/ui/Input";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useTimerStore, phaseTotal, MIN_MINUTES, MAX_MINUTES } from "@/store/timer";
import { sounds } from "@/lib/sounds";

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function DurationField({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: number;
  presets: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-medium">{label}</p>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-14 bg-[#141414] border border-border rounded-[8px] px-2 py-1 text-[13px] text-white text-center outline-none transition focus:border-accent"
            aria-label={`${label} minutes`}
          />
          <span className="text-[11px] text-muted-2">min</span>
        </div>
      </div>
      <div className="flex gap-1.5">
        {presets.map((p) => (
          <button key={p} type="button" onClick={() => onChange(p)} className={`tag ${value === p ? "tag-green" : ""}`}>
            {p}m
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TimerPage() {
  const { data: tasks } = useTasks({ isDone: false });
  const { data: habits } = useHabits();

  const mode = useTimerStore((s) => s.mode);
  const sessionCount = useTimerStore((s) => s.sessionCount);
  const secondsLeft = useTimerStore((s) => s.secondsLeft);
  const running = useTimerStore((s) => s.running);
  const taskId = useTimerStore((s) => s.taskId);
  const habitId = useTimerStore((s) => s.habitId);
  const workMin = useTimerStore((s) => s.workMin);
  const shortBreakMin = useTimerStore((s) => s.shortBreakMin);
  const longBreakMin = useTimerStore((s) => s.longBreakMin);

  const setRunning = useTimerStore((s) => s.setRunning);
  const setTaskId = useTimerStore((s) => s.setTaskId);
  const setHabitId = useTimerStore((s) => s.setHabitId);
  const setMinutes = useTimerStore((s) => s.setMinutes);
  const resetPhase = useTimerStore((s) => s.resetPhase);
  const goToBreak = useTimerStore((s) => s.goToBreak);
  const goToWork = useTimerStore((s) => s.goToWork);

  const total = phaseTotal(mode, sessionCount, { workMin, shortBreakMin, longBreakMin });
  const pct = ((total - secondsLeft) / total) * 100;
  const dotsFilled = sessionCount % 4 === 0 && sessionCount > 0 ? 4 : sessionCount % 4;

  const currentTask = tasks?.find((t) => t.id === taskId);
  const currentHabit = habits?.find((h) => h.id === habitId);
  const focusLabel = currentTask?.title ?? currentHabit?.title ?? "No focus selected";

  // ambient: active when running in work mode
  const ambient = running && mode === "work";

  function toggle() {
    if (!running) sounds.timerStart();
    setRunning(!running);
  }

  function reset() {
    setRunning(false);
    resetPhase();
  }

  function skip() {
    if (mode === "work") {
      sounds.timerEnd();
      goToBreak(sessionCount + 1);
    } else {
      sounds.breakEnd();
      goToWork();
    }
  }

  const modeLabel = mode === "work" ? "Focus session" : sessionCount % 4 === 0 ? "Long break" : "Short break";

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:flex-row lg:items-start lg:gap-7">
      <Card className="w-full lg:w-[380px] lg:shrink-0 text-center py-8 relative overflow-hidden">
        {ambient && <div className="absolute inset-0 celebrate opacity-60 pointer-events-none" />}

        <p className="eyebrow mb-5 relative z-10">{modeLabel}</p>

        <div className="mx-auto relative z-10" style={{ width: 248, height: 248 }}>
          <Ring pct={pct} size={248} sw={12}>
            <div className="text-center">
              <div className="timer-time text-[44px]">{fmt(secondsLeft)}</div>
              <p className="text-muted text-[12px] mt-1 max-w-[160px] truncate mx-auto">
                {mode === "work" ? focusLabel : "Step away & stretch"}
              </p>
            </div>
          </Ring>
        </div>

        <div className="dots flex justify-center gap-2.5 mt-6 relative z-10">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={i < dotsFilled ? "on" : ""} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-5 mt-7 relative z-10">
          <button className="btn-circle-sm" onClick={reset} aria-label="Reset">
            <RotateCcw size={18} />
          </button>
          <button className="btn-round" onClick={toggle} aria-label={running ? "Pause" : "Start"}>
            {running ? <Pause size={26} fill="#000" /> : <Play size={26} fill="#000" />}
          </button>
          <button className="btn-circle-sm" onClick={skip} aria-label="Skip">
            <SkipForward size={18} />
          </button>
        </div>
      </Card>

      <div className="flex flex-col gap-6 w-full lg:flex-1">
        <Card className="w-full">
          <p className="eyebrow mb-2">Focus on task</p>
          <Select value={taskId} onChange={(e) => { setTaskId(e.target.value); if (e.target.value) setHabitId(""); }}>
            <option value="">No task</option>
            {tasks?.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </Select>
        </Card>

        <Card className="w-full">
          <p className="eyebrow mb-2">Focus on habit</p>
          <Select value={habitId} onChange={(e) => { setHabitId(e.target.value); if (e.target.value) setTaskId(""); }}>
            <option value="">No habit</option>
            {habits?.map((h) => (
              <option key={h.id} value={h.id}>{h.title} · {h.streak}🔥</option>
            ))}
          </Select>
          {currentHabit && (
            <p className="text-[11.5px] text-muted-2 mt-2">
              Session end will auto-check <span className="text-accent">{currentHabit.title}</span> for today.
            </p>
          )}
        </Card>

        <Card className="w-full">
          <p className="eyebrow mb-3">Session length</p>
          <DurationField
            label="Focus"
            value={workMin}
            presets={[15, 25, 45, 60]}
            onChange={(v) => setMinutes("workMin", v)}
          />
          <DurationField
            label="Short break"
            value={shortBreakMin}
            presets={[5, 10, 15]}
            onChange={(v) => setMinutes("shortBreakMin", v)}
          />
          <DurationField
            label="Long break"
            value={longBreakMin}
            presets={[15, 20, 30]}
            onChange={(v) => setMinutes("longBreakMin", v)}
          />
          {running && <p className="text-[11px] text-muted-2 mt-1">Changes apply once the current session pauses or ends.</p>}
        </Card>
      </div>
    </div>
  );
}
