export interface Task {
  id: number;
  text: string;
  tag: string;
  completed: boolean;
}

export interface DiaryBlockType {
  id: number;
  type: "text" | "h1" | "h2" | "h3" | "divider" | "checklist" | "ul" | "ol";
  content: string;
  checked?: boolean;
  num?: number;
}

export interface IdeaItem {
  id: number;
  text: string;
}

export interface HistoryItem {
  id: number;
  dayName: string;
  time: string;
  mission: string;
  minutes: number;
  depthScore: number;
  completedTasks: number;
  totalTasks: number;
  taskNames?: string[];
  graphDayIndex: number;
  weekKey: string;
  note: string;
}

export interface Stats {
  todayMinutes: number;
  weekMinutes: number;
  streak: number;
}

export interface TagType {
  name: string;
  color: string;
}
