import { api } from "./client";
import type { Priority, Task } from "@/types";

export async function fetchTasks(params?: { goalId?: string; isDone?: boolean }) {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks", { params });
  return data.tasks;
}

export async function createTask(input: {
  title: string;
  goalId?: string | null;
  priority?: Priority;
  dueDate?: string | null;
}) {
  const { data } = await api.post<{ task: Task }>("/tasks", input);
  return data.task;
}

export async function updateTask(id: string, input: Partial<Pick<Task, "title" | "isDone" | "priority" | "dueDate" | "goalId">>) {
  const { data } = await api.patch<{ task: Task }>(`/tasks/${id}`, input);
  return data.task;
}

export async function deleteTask(id: string) {
  await api.delete(`/tasks/${id}`);
}
