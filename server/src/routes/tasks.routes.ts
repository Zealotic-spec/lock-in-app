import { Router } from "express";
import { createTask, deleteTask, listTasks, updateTask } from "../controllers/tasks.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listTasks));
router.post("/", asyncHandler(createTask));
router.patch("/:id", asyncHandler(updateTask));
router.delete("/:id", asyncHandler(deleteTask));

export default router;
