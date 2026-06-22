import { useEffect, useState } from "react";

export function MiniBarChart({ data, height = 90 }: { data: { d: string; v: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 100);
    return () => clearTimeout(t);
  }, []);
  const hot = data.reduce((mi, d, i, a) => (d.v > a[mi].v ? i : mi), 0);
  return (
    <div className="barchart" style={{ height }}>
      {data.map((d, i) => (
        <div className="col" key={i}>
          <div
            className={`bar ${i === hot ? "bar-hot" : ""}`}
            style={{ height: grown ? `${(d.v / max) * 100}%` : "0%" }}
          />
          <span className="cl">{d.d}</span>
        </div>
      ))}
    </div>
  );
}
