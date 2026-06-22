import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface Point {
  label: string;
  v: number;
}

export function GrowthAreaChart({ data, height = 180 }: { data: Point[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#39FF14" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#39FF14" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <Tooltip
            cursor={{ stroke: "#2A2A2A" }}
            contentStyle={{
              background: "#1A1A1A",
              border: "1px solid #2A2A2A",
              borderRadius: 10,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
            }}
            labelStyle={{ color: "#A0A0A0" }}
            itemStyle={{ color: "#39FF14" }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke="#39FF14"
            strokeWidth={2.5}
            fill="url(#growthFill)"
            dot={false}
            activeDot={{ r: 4.5, fill: "#39FF14", stroke: "#39FF14" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(57,255,20,.5))" }}
            isAnimationActive
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
