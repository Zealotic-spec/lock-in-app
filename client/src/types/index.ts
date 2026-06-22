export type Frequency = "DAILY" | "WEEKLY";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type GoalStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  color: string;
  frequency: Frequency;
  streak: number;
  createdAt: string;
  logs?: HabitLog[];
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  progress: number;
  deadline: string | null;
  status: GoalStatus;
  createdAt: string;
  linkedTasksCount?: number;
  linkedTasksDone?: number;
}

export interface Task {
  id: string;
  userId: string;
  goalId: string | null;
  title: string;
  isDone: boolean;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
}

export interface DailyStat {
  id: string;
  userId: string;
  date: string;
  tasksDone: number;
  habitsDone: number;
  focusMins: number;
}

export interface StatsSummary {
  totals: { tasks: number; streak: number; hours: number };
  thisWeek: { tasks: number; hours: number };
  thisMonth: { tasks: number; hours: number };
  bestStreak: number;
  completionRate: number;
  totalHours: number;
  bestDay: string;
  dayOfWeek: { d: string; v: number }[];
}
