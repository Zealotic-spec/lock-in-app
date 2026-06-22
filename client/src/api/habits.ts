import { api } from "./client";
import type { Habit, HabitLog } from "@/types";

export async function fetchHabits() {
  const { data } = await api.get<{ habits: Habit[] }>("/habits");
  return data.habits;
}

export async function createHabit(input: { title: string; color?: string; frequency?: "DAILY" | "WEEKLY" }) {
  const { data } = await api.post<{ habit: Habit }>("/habits", input);
  return data.habit;
}

export async function updateHabit(id: string, input: Partial<Pick<Habit, "title" | "color" | "frequency">>) {
  const { data } = await api.patch<{ habit: Habit }>(`/habits/${id}`, input);
  return data.habit;
}

export async function deleteHabit(id: string) {
  await api.delete(`/habits/${id}`);
}

export async function logHabit(id: string, date: string, completed = true) {
  const { data } = await api.post<{ log: HabitLog; streak: number }>(`/habits/${id}/logs`, { date, completed });
  return data;
}

export async function fetchHabitLogs(from?: string, to?: string) {
  const { data } = await api.get<{ logs: HabitLog[] }>("/habits/logs", { params: { from, to } });
  return data.logs;
}
