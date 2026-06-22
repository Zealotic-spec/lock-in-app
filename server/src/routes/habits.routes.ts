import { Router } from "express";
import {
  createHabit,
  deleteHabit,
  listHabitLogs,
  listHabits,
  logHabit,
  updateHabit,
} from "../controllers/habits.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listHabits));
router.post("/", asyncHandler(createHabit));
router.get("/logs", asyncHandler(listHabitLogs)); // ?from=&to=
router.patch("/:id", asyncHandler(updateHabit));
router.delete("/:id", asyncHandler(deleteHabit));
router.post("/:id/logs", asyncHandler(logHabit));

export default router;
