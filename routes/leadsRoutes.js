import express from "express";
import { orgadminOrAdmin } from "../middleware/authMiddleware.js";
import {
  createLead,
  leadsList,
  getLeadById,
  deleteLead,
  updateLead,
  updateLeadStatus,
} from "../controllers/leadsController.js";
const router = express.Router();

// create leads
router.post("/save", ...orgadminOrAdmin, createLead);

// get leads list
router.post("/list", ...orgadminOrAdmin, leadsList);

// get leads by id
router.get("/get/:id", ...orgadminOrAdmin, getLeadById);

// delete leads
router.delete("/delete/:id", ...orgadminOrAdmin, deleteLead);

// update leads
router.put("/update/:id", ...orgadminOrAdmin, updateLead);

// update leads status
router.post("/status/update", ...orgadminOrAdmin, updateLeadStatus);

export default router;
