import { api } from "./client";
import type { Goal, GoalStatus } from "@/types";

export async function fetchGoals() {
  const { data } = await api.get<{ goals: Goal[] }>("/goals");
  return data.goals;
}

export async function createGoal(input: {
  title: string;
  description?: string | null;
  deadline?: string | null;
  progress?: number;
  status?: GoalStatus;
}) {
  const { data } = await api.post<{ goal: Goal }>("/goals", input);
  return data.goal;
}

export async function updateGoal(
  id: string,
  input: Partial<Pick<Goal, "title" | "description" | "deadline" | "progress" | "status">>,
) {
  const { data } = await api.patch<{ goal: Goal }>(`/goals/${id}`, input);
  return data.goal;
}

export async function deleteGoal(id: string) {
  await api.delete(`/goals/${id}`);
}
