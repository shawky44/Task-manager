import express from "express";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";
import {
  createTask,
  deleteTask,
  getDashboardData,
  getTasks,
  getTaskById,
  getUserDashboardData,
  updateTask,
  updateTaskChecklist,
  updateTaskStatus,
} from "../controllers/taskController.js";

const router = express.Router();

router.get("/dashboard-data", protect, getDashboardData);
router.get("/user-dashboard-data", protect, getUserDashboardData);
router.get("/", protect, getTasks); // get all tasks (admin :all,user: assigned)
router.get("/:id", protect, getTaskById); // get task by Id
router.post("/", protect, adminOnly, createTask); // create a task (Admin only )
router.put("/:id", protect, updateTask); // update task details
router.delete("/:id", protect, adminOnly, deleteTask); // delete a task (Admin only )
router.put("/:id/status", protect, updateTaskStatus); // update task Status
router.patch("/:id/todo", protect, updateTaskChecklist); // update task Checklist

export default router;
