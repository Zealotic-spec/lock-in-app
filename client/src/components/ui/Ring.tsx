import { useEffect, useState, type ReactNode } from "react";

export function Ring({
  pct,
  size = 120,
  sw = 10,
  children,
  delay = 0,
  color,
}: {
  pct: number;
  size?: number;
  sw?: number;
  children?: ReactNode;
  delay?: number;
  color?: string;
}) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const [off, setOff] = useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOff(c - (pct / 100) * c), 80 + delay);
    return () => clearTimeout(t);
  }, [pct, c, delay]);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={sw} />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={
            color
              ? { stroke: color, filter: `drop-shadow(0 0 6px ${color}99)` }
              : undefined
          }
        />
      </svg>
      <div className="absolute grid place-items-center">{children}</div>
    </div>
  );
}
