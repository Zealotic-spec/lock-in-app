import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/asyncHandler.js";

const createSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).nullable().optional(),
  deadline: z.string().nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
});

const updateSchema = createSchema.partial();

export async function listGoals(req: Request, res: Response) {
  const goals = await prisma.goal.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    include: { tasks: { select: { id: true, isDone: true } } },
  });
  const withCounts = goals.map((g) => ({
    ...g,
    linkedTasksCount: g.tasks.length,
    linkedTasksDone: g.tasks.filter((t) => t.isDone).length,
    tasks: undefined,
  }));
  res.json({ goals: withCounts });
}

export async function createGoal(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  const goal = await prisma.goal.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      progress: data.progress ?? 0,
      status: data.status,
      deadline: data.deadline ? new Date(data.deadline) : null,
      userId: req.userId!,
    },
  });
  res.status(201).json({ goal });
}

export async function updateGoal(req: Request, res: Response) {
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new ApiError(404, "Goal not found.");

  const data = updateSchema.parse(req.body);
  const goal = await prisma.goal.update({
    where: { id: req.params.id },
    data: {
      ...data,
      deadline: data.deadline === undefined ? undefined : data.deadline ? new Date(data.deadline) : null,
    },
  });
  res.json({ goal });
}

export async function deleteGoal(req: Request, res: Response) {
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new ApiError(404, "Goal not found.");
  await prisma.goal.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
