import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/asyncHandler.js";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  frequency: z.enum(["DAILY", "WEEKLY"]).optional(),
});

const updateSchema = createSchema.partial().extend({
  streak: z.number().int().min(0).optional(),
});

const logSchema = z.object({
  date: z.string(), // ISO date, e.g. "2026-06-22"
  completed: z.boolean().optional(),
});

async function ownedHabit(id: string, userId: string) {
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw new ApiError(404, "Habit not found.");
  return habit;
}

export async function listHabits(req: Request, res: Response) {
  const habits = await prisma.habit.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
    include: { logs: { orderBy: { date: "desc" }, take: 200 } },
  });
  res.json({ habits });
}

export async function createHabit(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  const habit = await prisma.habit.create({
    data: { ...data, userId: req.userId! },
  });
  res.status(201).json({ habit });
}

export async function updateHabit(req: Request, res: Response) {
  await ownedHabit(req.params.id, req.userId!);
  const data = updateSchema.parse(req.body);
  const habit = await prisma.habit.update({ where: { id: req.params.id }, data });
  res.json({ habit });
}

export async function deleteHabit(req: Request, res: Response) {
  await ownedHabit(req.params.id, req.userId!);
  await prisma.habit.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

// Toggle/record a habit check-in for a given date, then recompute the streak.
export async function logHabit(req: Request, res: Response) {
  const habit = await ownedHabit(req.params.id, req.userId!);
  const { date, completed = true } = logSchema.parse(req.body);
  const day = startOfDay(new Date(date));

  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: habit.id, date: day } },
    update: { completed },
    create: { habitId: habit.id, userId: req.userId!, date: day, completed },
  });

  const streak = await computeStreak(habit.id);
  await prisma.habit.update({ where: { id: habit.id }, data: { streak } });

  // Sync DailyStat.habitsDone: count how many unique habits are completed on this date.
  const habitsDone = await prisma.habitLog.count({
    where: { userId: req.userId!, date: day, completed: true },
  });
  await prisma.dailyStat.upsert({
    where: { userId_date: { userId: req.userId!, date: day } },
    update: { habitsDone },
    create: { userId: req.userId!, date: day, habitsDone, tasksDone: 0, focusMins: 0 },
  });

  res.json({ log, streak });
}

export async function listHabitLogs(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  const logs = await prisma.habitLog.findMany({
    where: {
      userId: req.userId,
      ...(from || to
        ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    },
    orderBy: { date: "asc" },
  });
  res.json({ logs });
}

async function computeStreak(habitId: string): Promise<number> {
  const logs = await prisma.habitLog.findMany({
    where: { habitId, completed: true },
    orderBy: { date: "desc" },
    select: { date: true },
  });
  if (logs.length === 0) return 0;

  let streak = 0;
  let cursor = startOfDay(new Date());
  const dates = new Set(logs.map((l) => startOfDay(l.date).getTime()));

  // Walk backwards from today (or yesterday, if today not yet logged) while consecutive days exist.
  if (!dates.has(cursor.getTime())) {
    cursor = addDays(cursor, -1);
  }
  while (dates.has(cursor.getTime())) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

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
