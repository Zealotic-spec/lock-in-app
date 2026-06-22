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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      qc.invalidateQueries({ queryKey: ["habit-logs"] });
      qc.invalidateQueries({ queryKey: ["stats-summary"] });
    },
  });
}
