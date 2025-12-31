import express from "express";
import { orgadminOrAdmin } from "../middleware/authMiddleware.js";
import {
  createCompany,
  companyList,
  deleteCompany,
  getCompanyById,
  updateCompany,
} from "../controllers/componyController.js";
const router = express.Router();
// create company
router.post("/save", ...orgadminOrAdmin, createCompany);
// get company list
router.post("/list", ...orgadminOrAdmin, companyList);
// get company by id
router.get("/get/:id", ...orgadminOrAdmin, getCompanyById);
// delete company
router.delete("/delete/:id", ...orgadminOrAdmin, deleteCompany);
// update company
router.put("/update/:id", ...orgadminOrAdmin, updateCompany);
export default router;
