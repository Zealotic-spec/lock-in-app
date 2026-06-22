import { Router } from "express";
import { createGoal, deleteGoal, listGoals, updateGoal } from "../controllers/goals.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listGoals));
router.post("/", asyncHandler(createGoal));
router.patch("/:id", asyncHandler(updateGoal));
router.delete("/:id", asyncHandler(deleteGoal));

export default router;
