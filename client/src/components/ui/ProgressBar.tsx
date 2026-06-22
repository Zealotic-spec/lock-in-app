import { useEffect, useState } from "react";

export function ProgressBar({ pct, delay = 0 }: { pct: number; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 60 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="bar-track">
      <div className="bar-fill" style={{ width: `${w}%` }} />
    </div>
  );
}
