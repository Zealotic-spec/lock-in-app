import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  label: string;
  v: number;
}

interface Props {
  data: Point[];
  height?: number;
  color?: string;
  name?: string;
  unit?: string;
  showXAxis?: boolean;
}

export function GrowthAreaChart({
  data,
  height = 180,
  color = "#39FF14",
  name = "Value",
  unit = "",
  showXAxis = false,
}: Props) {
  const gradientId = `gf-${color.replace(/[^a-z0-9]/gi, "")}`;
  const glowColor = `${color}80`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -28 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6a6a6a", fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}
            width={36}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
          />
          <XAxis
            dataKey="label"
            hide={!showXAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6a6a6a", fontFamily: "JetBrains Mono, monospace", fontSize: 10 }}
            interval="preserveStartEnd"
          />
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
            itemStyle={{ color }}
            formatter={(v: number) => [`${v}${unit ? " " + unit : ""}`, name]}
          />
          <Area
            type="monotone"
            dataKey="v"
            name={name}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4.5, fill: color, stroke: color }}
            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
