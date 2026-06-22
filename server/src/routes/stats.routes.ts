import { Router } from "express";
import { listDailyStats, logFocusSession, summary } from "../controllers/stats.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listDailyStats)); // ?from=&to=
router.get("/summary", asyncHandler(summary));
router.post("/focus", asyncHandler(logFocusSession));

export default router;
