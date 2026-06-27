import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export function ProductiveDayChart({ data, height = 160, interval }: { data: { d: string; v: number }[]; height?: number; interval?: number }) {
  const max = Math.max(0, ...data.map((d) => d.v));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="22%">
          <XAxis
            dataKey="d"
            axisLine={false}
            tickLine={false}
            interval={interval ?? "preserveStartEnd"}
            tick={{ fill: "#6a6a6a", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
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
          <Bar dataKey="v" radius={[6, 6, 3, 3]} isAnimationActive animationDuration={900}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.v === max && max > 0 ? "#39FF14" : "#222"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
