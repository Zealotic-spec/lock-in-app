import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Ring } from "@/components/ui/Ring";
import { Select } from "@/components/ui/Input";
import { useTasks } from "@/hooks/useTasks";
import { useLogFocusSession } from "@/hooks/useStats";
import { useTimerSettings, type TimerSettings } from "@/hooks/useTimerSettings";
import { sounds } from "@/lib/sounds";

type Mode = "work" | "break";

function formatTime(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function DurationField({
  label,
  value,
  presets,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  presets: number[];
  min: number;
  max: number;
  onChange: (mins: number) => void;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-medium">{label}</p>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={min}
            max={max}
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

function phaseSeconds(mode: Mode, sessionCount: number, settings: TimerSettings) {
  if (mode === "work") return settings.workMin * 60;
  return (sessionCount % 4 === 0 ? settings.longBreakMin : settings.shortBreakMin) * 60;
}

export default function TimerPage() {
  const { data: tasks } = useTasks({ isDone: false });
  const logFocus = useLogFocusSession();
  const { settings, setMinutes, MIN_MINUTES, MAX_MINUTES } = useTimerSettings();

  const [mode, setMode] = useState<Mode>("work");
  const [sessionCount, setSessionCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() => phaseSeconds("work", 0, settings));
  const [running, setRunning] = useState(false);
  const [ambient, setAmbient] = useState(false);
  const [taskId, setTaskId] = useState<string>("");
  const [pulse, setPulse] = useState(false);

  const total = phaseSeconds(mode, sessionCount, settings);

  // tick the clock down one second at a time while running
  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      advancePhase();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, secondsLeft]);

  // If the user tweaks a duration while paused, reflect it immediately. While
  // a session is actively running we leave it alone so the countdown doesn't jump.
  useEffect(() => {
    if (running) return;
    setSecondsLeft(phaseSeconds(mode, sessionCount, settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.workMin, settings.shortBreakMin, settings.longBreakMin]);

  function advancePhase() {
    if (mode === "work") {
      logFocus.mutate(settings.workMin);
      setPulse(true);
      setTimeout(() => setPulse(false), 1900);
      sounds.timerEnd();
      const next = sessionCount + 1;
      setSessionCount(next);
      setMode("break");
      setSecondsLeft(phaseSeconds("break", next, settings));
    } else {
      sounds.breakEnd();
      setMode("work");
      setSecondsLeft(phaseSeconds("work", sessionCount, settings));
    }
  }

  function saveProgressIfAny() {
    if (mode !== "work") return;
    const elapsed = settings.workMin * 60 - secondsLeft;
    if (elapsed >= 60) logFocus.mutate(Math.round(elapsed / 60));
  }

  function toggleRunning() {
    if (!running) sounds.timerStart();
    setRunning((r) => !r);
  }

  function reset() {
    saveProgressIfAny();
    setRunning(false);
    setMode("work");
    setSecondsLeft(phaseSeconds("work", sessionCount, settings));
  }

  function skip() {
    saveProgressIfAny();
    advancePhase();
  }

  const dotsFilled = sessionCount % 4 === 0 && sessionCount > 0 ? 4 : sessionCount % 4;
  const currentTask = tasks?.find((t) => t.id === taskId);
  const pct = ((total - secondsLeft) / total) * 100;

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:flex-row lg:items-start lg:gap-7">
      <Card className="w-full lg:w-[380px] lg:shrink-0 text-center py-8 relative overflow-hidden">
        {ambient && <div className="absolute inset-0 celebrate opacity-60 pointer-events-none" />}

        <p className="eyebrow mb-5 relative z-10">
          {mode === "work" ? "Focus session" : sessionCount % 4 === 0 ? "Long break" : "Short break"}
        </p>

        <div className={`mx-auto relative z-10 ${pulse ? "timer-ring-pulse" : ""}`} style={{ width: 248, height: 248 }}>
          <Ring pct={pct} size={248} sw={12}>
            <div className="text-center">
              <div className="timer-time text-[44px]">{formatTime(secondsLeft)}</div>
              <p className="text-muted text-[12px] mt-1 max-w-[160px] truncate mx-auto">
                {mode === "work" ? currentTask?.title ?? "No task selected" : "Step away & stretch"}
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
          <button className="btn-round" onClick={toggleRunning} aria-label={running ? "Pause" : "Start"}>
            {running ? <Pause size={26} fill="#000" /> : <Play size={26} fill="#000" />}
          </button>
          <button className="btn-circle-sm" onClick={skip} aria-label="Skip">
            <SkipForward size={18} />
          </button>
        </div>
      </Card>

      <div className="flex flex-col gap-6 w-full lg:flex-1">
        <Card className="w-full">
          <p className="eyebrow mb-2">Current task</p>
          <Select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">No task — just focus</option>
            {tasks?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
        </Card>

        <Card className="w-full">
          <p className="eyebrow mb-3">Session length</p>
          <DurationField
            label="Focus"
            value={settings.workMin}
            presets={[15, 25, 45, 60]}
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            onChange={(v) => setMinutes("workMin", v)}
          />
          <DurationField
            label="Short break"
            value={settings.shortBreakMin}
            presets={[5, 10, 15]}
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            onChange={(v) => setMinutes("shortBreakMin", v)}
          />
          <DurationField
            label="Long break"
            value={settings.longBreakMin}
            presets={[15, 20, 30]}
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            onChange={(v) => setMinutes("longBreakMin", v)}
          />
          {running && <p className="text-[11px] text-muted-2 mt-1">Changes apply once the current session pauses or ends.</p>}
        </Card>

        <Card className="w-full flex items-center justify-between">
          <div>
            <p className="text-[14px] font-medium">Ambient mode</p>
            <p className="text-[12px] text-muted-2">Dim the screen for deep focus</p>
          </div>
          <button
            className={`switch ${ambient ? "switch-on" : ""}`}
            onClick={() => setAmbient((v) => !v)}
            aria-pressed={ambient}
            aria-label="Toggle ambient mode"
          >
            <i />
          </button>
        </Card>
      </div>
    </div>
  );
}
