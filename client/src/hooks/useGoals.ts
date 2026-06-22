import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as goalsApi from "@/api/goals";
import type { Goal } from "@/types";

export function useGoals() {
  return useQuery({ queryKey: ["goals"], queryFn: goalsApi.fetchGoals });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof goalsApi.createGoal>[0]) => goalsApi.createGoal(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<Goal, "title" | "description" | "deadline" | "progress" | "status">> }) =>
      goalsApi.updateGoal(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
