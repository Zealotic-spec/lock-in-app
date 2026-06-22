import { api } from "./client";
import type { DailyStat, StatsSummary } from "@/types";

export async function fetchStatsSummary() {
  const { data } = await api.get<StatsSummary>("/stats/summary");
  return data;
}

export async function fetchDailyStats(from?: string, to?: string) {
  const { data } = await api.get<{ stats: DailyStat[] }>("/stats", { params: { from, to } });
  return data.stats;
}

export async function logFocusSession(minutes: number) {
  const { data } = await api.post<{ stat: DailyStat }>("/stats/focus", { minutes });
  return data.stat;
}
