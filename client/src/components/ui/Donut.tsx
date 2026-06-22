import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function Donut({ data, size = 160, centerLabel }: { data: DonutSegment[]; size?: number; centerLabel?: string }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="68%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive
            animationDuration={1000}
          >
            {data.map((seg, i) => (
              <Cell key={i} fill={seg.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <span className="stat-num text-2xl">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}

export function DonutLegend({ data }: { data: DonutSegment[] }) {
  return (
    <div className="flex flex-col gap-2">
      {data.map((seg) => (
        <div key={seg.label} className="flex items-center gap-2 text-[13px] text-muted">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}` }} />
          <span className="flex-1">{seg.label}</span>
          <span className="font-mono text-white">{seg.value}%</span>
        </div>
      ))}
    </div>
  );
}
