import express from "express";
import { orgadminOrAdmin } from "../middleware/authMiddleware.js";
import {
  createTask,
  tasksList,
  getTaskById,
  deleteTask,
  updateTask,
  updateTaskStatus,
  dashboardData,
} from "../controllers/taskController.js";
const router = express.Router();

// create task
router.post("/save", ...orgadminOrAdmin, createTask);

// get tasks list
router.post("/list", ...orgadminOrAdmin, tasksList);

// get task by id
router.get("/get/:id", ...orgadminOrAdmin, getTaskById);

// delete task
router.delete("/delete/:id", ...orgadminOrAdmin, deleteTask);

// update task
router.put("/update/:id", ...orgadminOrAdmin, updateTask);

// update task status
router.post("/status/update", ...orgadminOrAdmin, updateTaskStatus);

// dashboard data
router.get("/dashboard", ...orgadminOrAdmin, dashboardData);

export default router;
