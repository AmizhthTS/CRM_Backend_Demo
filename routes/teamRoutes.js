import express from "express";
import { adminOnly, orgadminOrAdmin } from "../middleware/authMiddleware.js";
import {
  getTeamById,
  teamDelete,
  teamList,
  teamSave,
  teamUpdate,
} from "../controllers/teamController.js";

const router = express.Router();
// create team
router.post("/save", ...adminOnly, teamSave);
// get team list
router.post("/list", ...orgadminOrAdmin, teamList);
// get team by id
router.get("/get/:id", ...adminOnly, getTeamById);
// delete team
router.delete("/delete/:id", ...adminOnly, teamDelete);
// update team
router.put("/update/:id", ...adminOnly, teamUpdate);
export default router;
