import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/asyncHandler.js";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  goalId: z.string().uuid().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().nullable().optional(),
});

const updateSchema = createSchema.partial().extend({
  isDone: z.boolean().optional(),
});

export async function listTasks(req: Request, res: Response) {
  const { goalId, isDone } = req.query as { goalId?: string; isDone?: string };
  const tasks = await prisma.task.findMany({
    where: {
      userId: req.userId,
      ...(goalId ? { goalId } : {}),
      ...(isDone !== undefined ? { isDone: isDone === "true" } : {}),
    },
    orderBy: [{ isDone: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  res.json({ tasks });
}

export async function createTask(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  const task = await prisma.task.create({
    data: {
      title: data.title,
      goalId: data.goalId ?? null,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      userId: req.userId!,
    },
  });
  res.status(201).json({ task });
}

export async function updateTask(req: Request, res: Response) {
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new ApiError(404, "Task not found.");

  const data = updateSchema.parse(req.body);
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      ...data,
      dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  // Keep today's DailyStat.tasksDone roughly in sync when a task is completed.
  if (data.isDone && !existing.isDone) {
    await bumpDailyStat(req.userId!, { tasksDone: 1 });
  }

  res.json({ task });
}

export async function deleteTask(req: Request, res: Response) {
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new ApiError(404, "Task not found.");
  await prisma.task.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

async function bumpDailyStat(userId: string, delta: { tasksDone?: number; habitsDone?: number; focusMins?: number }) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  await prisma.dailyStat.upsert({
    where: { userId_date: { userId, date } },
    update: {
      tasksDone: { increment: delta.tasksDone ?? 0 },
      habitsDone: { increment: delta.habitsDone ?? 0 },
      focusMins: { increment: delta.focusMins ?? 0 },
    },
    create: {
      userId,
      date,
      tasksDone: delta.tasksDone ?? 0,
      habitsDone: delta.habitsDone ?? 0,
      focusMins: delta.focusMins ?? 0,
    },
  });
}
