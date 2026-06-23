import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as tasksApi from "@/api/tasks";
import type { Priority, Task } from "@/types";

export function useTasks(params?: { goalId?: string; isDone?: boolean }) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => tasksApi.fetchTasks(params),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; goalId?: string | null; priority?: Priority; dueDate?: string | null }) =>
      tasksApi.createTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<Task, "title" | "isDone" | "priority" | "dueDate" | "goalId">> }) =>
      tasksApi.updateTask(id, input),

    // Instantly update task state across all query variants.
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const snapshots = qc.getQueriesData<Task[]>({ queryKey: ["tasks"] });
      qc.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) =>
        old?.map((t) => (t.id === id ? { ...t, ...input } : t))
      );
      return { snapshots };
    },

    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["stats-summary"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
