import { lastNDays, toISODate } from "@/lib/utils";

const DAY_LABELS = ["M", "", "W", "", "F", "", "S"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function levelFor(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

export function Heatmap({ countByDate, weeks = 26 }: { countByDate: Record<string, number>; weeks?: number }) {
  const todayStr = toISODate();
  const days = lastNDays(weeks * 7);
  const lead = (new Date(days[0]).getDay() + 6) % 7;
  const padded: (string | null)[] = [...Array(lead).fill(null), ...days];
  const numCols = Math.ceil(padded.length / 7);

  // Month label per data-column (shown when month changes)
  const monthLabels: string[] = [];
  let prevMonth = -1;
  for (let col = 0; col < numCols; col++) {
    let label = "";
    for (let row = 0; row < 7; row++) {
      const day = padded[col * 7 + row];
      if (day) {
        const m = new Date(day + "T00:00:00").getMonth();
        if (m !== prevMonth) {
          label = MONTH_NAMES[m];
          prevMonth = m;
        }
        break;
      }
    }
    monthLabels.push(label);
  }

  return (
    <div>
      {/* Month labels — left-padded to skip the 12px day-label col + 4px gap */}
      <div className="heat-months" style={{ paddingLeft: 16 }}>
        {monthLabels.map((label, i) => (
          <div key={i}>{label}</div>
        ))}
      </div>

      {/* Grid: col 0 = day labels (12px), cols 1..N = data (1fr each) */}
      <div className="heat">
        {DAY_LABELS.map((d, i) => (
          <span key={`dl-${i}`}>{d}</span>
        ))}
        {padded.map((day, i) =>
          day === null ? (
            <i key={`pad-${i}`} style={{ visibility: "hidden" }} />
          ) : (
            <i
              key={day}
              data-l={levelFor(countByDate[day] || 0)}
              data-today={day === todayStr ? "" : undefined}
              title={`${new Date(day + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })} — ${countByDate[day] || 0} habits`}
            />
          ),
        )}
      </div>
    </div>
  );
}
