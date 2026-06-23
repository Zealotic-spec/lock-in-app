import { useNavigate, useLocation } from "react-router-dom";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useTimerStore, phaseTotal } from "@/store/timer";
import { sounds } from "@/lib/sounds";

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function FloatingTimer() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const mode = useTimerStore((s) => s.mode);
  const sessionCount = useTimerStore((s) => s.sessionCount);
  const secondsLeft = useTimerStore((s) => s.secondsLeft);
  const running = useTimerStore((s) => s.running);
  const setRunning = useTimerStore((s) => s.setRunning);
  const resetPhase = useTimerStore((s) => s.resetPhase);
  const workMin = useTimerStore((s) => s.workMin);
  const shortBreakMin = useTimerStore((s) => s.shortBreakMin);
  const longBreakMin = useTimerStore((s) => s.longBreakMin);

  const total = phaseTotal(mode, sessionCount, { workMin, shortBreakMin, longBreakMin });
  const started = secondsLeft < total;
  const isTimerPage = pathname === "/timer";

  // Show only when away from timer page and session is in progress or running
  if (isTimerPage || (!running && !started)) return null;

  const pct = Math.round(((total - secondsLeft) / total) * 100);
  const isWork = mode === "work";
  const label = isWork ? "Focus" : sessionCount % 4 === 0 ? "Long break" : "Short break";

  function toggle() {
    if (!running) sounds.timerStart();
    setRunning(!running);
  }

  function reset() {
    resetPhase();
  }

  return (
    <div
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-border bg-surface shadow-glow cursor-pointer select-none"
      style={{ backdropFilter: "blur(12px)" }}
      onClick={() => navigate("/timer")}
      role="button"
      aria-label="Open timer"
    >
      {/* progress ring — tiny */}
      <svg width="36" height="36" className="shrink-0 -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#2a2a2a" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="14"
          fill="none"
          stroke={isWork ? "#39ff14" : "#888"}
          strokeWidth="3"
          strokeDasharray={`${2 * Math.PI * 14}`}
          strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s linear" }}
        />
        <g transform="rotate(90, 18, 18)">
          <text x="18" y="22" textAnchor="middle" fontSize="9" fontFamily="monospace" fill={isWork ? "#39ff14" : "#888"} fontWeight="700">
            {pct}%
          </text>
        </g>
      </svg>

      <div className="flex flex-col min-w-0" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-[11px] text-muted-2 uppercase tracking-widest leading-none mb-0.5">{label}</span>
        <span className={`font-mono text-[20px] font-bold leading-none ${isWork ? "text-accent" : "text-white"}`} style={isWork ? { textShadow: "0 0 12px rgba(57,255,20,0.5)" } : {}}>
          {fmt(secondsLeft)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-1" onClick={(e) => e.stopPropagation()}>
        <button
          className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-muted hover:text-white transition"
          onClick={reset}
          aria-label="Reset timer"
        >
          <RotateCcw size={13} />
        </button>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition"
          style={{ background: isWork ? "#39ff14" : "#333" }}
          onClick={toggle}
          aria-label={running ? "Pause" : "Resume"}
        >
          {running
            ? <Pause size={14} fill={isWork ? "#000" : "#fff"} color={isWork ? "#000" : "#fff"} />
            : <Play size={14} fill={isWork ? "#000" : "#fff"} color={isWork ? "#000" : "#fff"} />}
        </button>
      </div>
    </div>
  );
}
