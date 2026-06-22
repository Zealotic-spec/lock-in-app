import { lastNDays } from "@/lib/utils";

function levelFor(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

export function Heatmap({ countByDate, weeks = 26 }: { countByDate: Record<string, number>; weeks?: number }) {
  const days = lastNDays(weeks * 7);
  // pad to a multiple of 7 starting Monday so the grid reads as full weeks
  const lead = (new Date(days[0]).getDay() + 6) % 7;
  const padded = [...Array(lead).fill(null), ...days];

  return (
    <div className="overflow-x-auto pb-1">
      <div className="heat" style={{ minWidth: weeks * 17 }}>
        {padded.map((day, i) =>
          day === null ? (
            <i key={`pad-${i}`} style={{ visibility: "hidden" }} />
          ) : (
            <i key={day} data-l={levelFor(countByDate[day] || 0)} title={day} />
          ),
        )}
      </div>
    </div>
  );
}
