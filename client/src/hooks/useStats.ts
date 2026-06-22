import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as statsApi from "@/api/stats";

export function useStatsSummary() {
  return useQuery({ queryKey: ["stats-summary"], queryFn: statsApi.fetchStatsSummary });
}

export function useDailyStats(from?: string, to?: string) {
  return useQuery({
    queryKey: ["daily-stats", from, to],
    queryFn: () => statsApi.fetchDailyStats(from, to),
  });
}

export function useLogFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (minutes: number) => statsApi.logFocusSession(minutes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stats-summary"] });
      qc.invalidateQueries({ queryKey: ["daily-stats"] });
    },
  });
}
