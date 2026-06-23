import { useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { sounds } from "@/lib/sounds";

const BURST_OFFSETS = [
  [-18, -10],
  [18, -8],
  [-10, 16],
  [12, 14],
  [0, -20],
  [20, 4],
];

export function HabitCheckRow({
  title,
  meta,
  done,
  onToggle,
}: {
  title: string;
  meta?: string;
  done: boolean;
  onToggle: () => void;
}) {
  const [bursting, setBursting] = useState(false);

  function handleClick() {
    if (!done) {
      setBursting(true);
      setTimeout(() => setBursting(false), 600);
      sounds.habitCheck();
    } else {
      sounds.habitUncheck();
    }
    onToggle();
  }

  return (
    <div className="habit-row">
      <button
        className={`chk ${done ? "chk-on" : ""}`}
        onClick={handleClick}
        aria-pressed={done}
        aria-label={`Mark ${title} ${done ? "incomplete" : "complete"}`}
      >
        <Check size={16} strokeWidth={3} color="#000" />
        {bursting && (
          <span className="burst">
            {BURST_OFFSETS.map(([bx, by], i) => (
              <i key={i} style={{ "--bx": `${bx}px`, "--by": `${by}px` } as CSSProperties} />
            ))}
          </span>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[14.5px] font-medium truncate ${done ? "text-white" : "text-white"}`}>{title}</p>
        {meta && <p className="text-[12px] text-muted-2 font-mono">{meta}</p>}
      </div>
    </div>
  );
}
