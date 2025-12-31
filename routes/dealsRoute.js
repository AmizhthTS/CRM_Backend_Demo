import express from "express";
import { orgadminOrAdmin } from "../middleware/authMiddleware.js";
import {
  createDeal,
  dealsList,
  getDealById,
  deleteDeal,
  updateDeal,
  updateDealStage,
} from "../controllers/dealController.js";
const router = express.Router();

// create deals
router.post("/save", ...orgadminOrAdmin, createDeal);

// get deals list
router.post("/list", ...orgadminOrAdmin, dealsList);

// get deals by id
router.get("/get/:id", ...orgadminOrAdmin, getDealById);

// delete deals
router.delete("/delete/:id", ...orgadminOrAdmin, deleteDeal);

// update deals
router.put("/update/:id", ...orgadminOrAdmin, updateDeal);

// update deals stage
router.post("/stage/update", ...orgadminOrAdmin, updateDealStage);

export default router;
