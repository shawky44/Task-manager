import express from "express";
import { exportTasksReport, exportUsersReport } from "../controllers/reportController.js";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/export/tasks",protect,adminOnly,exportTasksReport)// Export all tasks as a PDF/Excel
router.get("/export/users",protect,adminOnly,exportUsersReport)// Export user-task report 
export default router;
