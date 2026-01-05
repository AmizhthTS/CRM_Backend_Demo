import express from "express";
import {
  countController,
  revenueOverviewController,
  leadSourceController,
  reportDataController,
} from "../controllers/dashboardController.js";
const router = express.Router();
router.get("/count", countController);
router.get("/revenue-overview", revenueOverviewController);
router.get("/lead-source", leadSourceController);
router.get("/report-data", reportDataController);
export default router;
