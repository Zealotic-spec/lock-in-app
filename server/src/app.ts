import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import goalsRoutes from "./routes/goals.routes.js";
import habitsRoutes from "./routes/habits.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "lock-in-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/habits", requireAuth, habitsRoutes);
app.use("/api/tasks", requireAuth, tasksRoutes);
app.use("/api/goals", requireAuth, goalsRoutes);
app.use("/api/stats", requireAuth, statsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
