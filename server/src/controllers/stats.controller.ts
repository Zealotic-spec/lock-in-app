import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const focusSchema = z.object({
  minutes: z.number().int().min(1).max(600),
});

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export async function listDailyStats(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  const stats = await prisma.dailyStat.findMany({
    where: {
      userId: req.userId,
      ...(from || to
        ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    },
    orderBy: { date: "asc" },
  });
  res.json({ stats });
}

// Record a finished focus session — bumps today's DailyStat.focusMins.
export async function logFocusSession(req: Request, res: Response) {
  const { minutes } = focusSchema.parse(req.body);
  const date = startOfDay(new Date());
  const stat = await prisma.dailyStat.upsert({
    where: { userId_date: { userId: req.userId!, date } },
    update: { focusMins: { increment: minutes } },
    create: { userId: req.userId!, date, focusMins: minutes, tasksDone: 0, habitsDone: 0 },
  });
  res.json({ stat });
}

// Aggregated numbers for the Dashboard + Stats pages.
export async function summary(req: Request, res: Response) {
  const userId = req.userId!;
  const now = new Date();
  const weekAgo = addDays(now, -7);
  const monthAgo = addDays(now, -30);

  const [habits, tasksDoneCount, allStats, weekStats, monthStats] = await Promise.all([
    prisma.habit.findMany({ where: { userId } }),
    prisma.task.count({ where: { userId, isDone: true } }),
    prisma.dailyStat.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.dailyStat.findMany({ where: { userId, date: { gte: startOfDay(weekAgo) } } }),
    prisma.dailyStat.findMany({ where: { userId, date: { gte: startOfDay(monthAgo) } } }),
  ]);

  const totalFocusMins = allStats.reduce((s, d) => s + d.focusMins, 0);
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  const sum = (rows: typeof allStats, key: "tasksDone" | "habitsDone" | "focusMins") =>
    rows.reduce((s, r) => s + r[key], 0);

  // Average tasksDone by day-of-week (Mon..Sun), for the "most productive day" chart.
  const dowTotals = [0, 0, 0, 0, 0, 0, 0];
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const row of allStats) {
    const idx = (new Date(row.date).getUTCDay() + 6) % 7; // 0=Mon..6=Sun
    dowTotals[idx] += row.tasksDone;
    dowCounts[idx] += 1;
  }
  const dowAvg = dowTotals.map((t, i) => Math.round(dowCounts[i] ? t / dowCounts[i] : 0));
  const dowLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const bestDayIdx = dowAvg.reduce((mi, v, i, a) => (v > a[mi] ? i : mi), 0);

  const totalHabitDays = habits.length * allStats.length;
  const completedHabitDays = sum(allStats, "habitsDone");
  const completionRate = totalHabitDays > 0 ? Math.round((completedHabitDays / totalHabitDays) * 100) : 0;

  res.json({
    totals: {
      tasks: tasksDoneCount,
      streak: bestStreak,
      hours: Math.round(totalFocusMins / 60),
    },
    thisWeek: { tasks: sum(weekStats, "tasksDone"), hours: Math.round(sum(weekStats, "focusMins") / 60) },
    thisMonth: { tasks: sum(monthStats, "tasksDone"), hours: Math.round(sum(monthStats, "focusMins") / 60) },
    bestStreak,
    completionRate,
    totalHours: Math.round(totalFocusMins / 60),
    bestDay: dowLabels[bestDayIdx],
    dayOfWeek: dowLabels.map((d, i) => ({ d, v: dowAvg[i] })),
  });
}
