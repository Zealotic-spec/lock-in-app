import type { ReactNode } from "react";
import { Flame } from "lucide-react";
import { cx } from "@/lib/utils";

export function Tag({ children, green = false }: { children: ReactNode; green?: boolean }) {
  return <span className={cx("tag", green && "tag-green")}>{children}</span>;
}

export function StreakChip({ days }: { days: number }) {
  return (
    <span className="streak-chip">
      <Flame size={14} /> Day {days}
    </span>
  );
}
