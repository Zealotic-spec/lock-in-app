import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as habitsApi from "@/api/habits";
import type { Frequency, Habit } from "@/types";

export function useHabits() {
  return useQuery({ queryKey: ["habits"], queryFn: habitsApi.fetchHabits });
}

export function useHabitLogs(from?: string, to?: string) {
  return useQuery({
    queryKey: ["habit-logs", from, to],
    queryFn: () => habitsApi.fetchHabitLogs(from, to),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; color?: string; frequency?: Frequency }) => habitsApi.createHabit(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<Habit, "title" | "color" | "frequency">> }) =>
      habitsApi.updateHabit(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsApi.deleteHabit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useLogHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date, completed }: { id: string; date: string; completed: boolean }) =>
      habitsApi.logHabit(id, date, completed),

    // Instantly flip the checkbox — no waiting for the server.
    onMutate: async ({ id, date, completed }) => {
      await qc.cancelQueries({ queryKey: ["habits"] });
      const prev = qc.getQueryData<Habit[]>(["habits"]);

      qc.setQueryData<Habit[]>(["habits"], (old) =>
        old?.map((h) => {
          if (h.id !== id) return h;
          const logs = h.logs ?? [];
          const exists = logs.some((l) => l.date.slice(0, 10) === date);
          const newLogs = exists
            ? logs.map((l) => (l.date.slice(0, 10) === date ? { ...l, completed } : l))
            : [...logs, { id: `opt-${Date.now()}`, habitId: id, userId: h.userId, date, completed }];
          return { ...h, logs: newLogs };
        })
      );

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["habits"], ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      qc.invalidateQueries({ queryKey: ["habit-logs"] });
      qc.invalidateQueries({ queryKey: ["stats-summary"] });
      qc.invalidateQueries({ queryKey: ["daily-stats"] });
    },
  });
}
