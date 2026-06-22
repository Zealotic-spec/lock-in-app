import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/asyncHandler.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Prisma unique constraint violation, etc.
  const code = (err as { code?: string } | undefined)?.code;
  if (code === "P2002") {
    return res.status(409).json({ error: "A record with that value already exists." });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
}
