import type { LucideIcon } from "lucide-react";
import { Home, ListChecks, Timer, CheckSquare, Target, BarChart3 } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  title: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { to: "/", label: "Home", title: "Dashboard", icon: Home },
  { to: "/habits", label: "Habits", title: "Habit Tracker", icon: ListChecks },
  { to: "/timer", label: "Timer", title: "Focus Timer", icon: Timer },
  { to: "/tasks", label: "Tasks", title: "Tasks", icon: CheckSquare },
  { to: "/goals", label: "Goals", title: "Goals & Progress", icon: Target },
  { to: "/stats", label: "Growth", title: "Growth", icon: BarChart3 },
];
