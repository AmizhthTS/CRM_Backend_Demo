import express from "express";
import { orgadminOrAdmin } from "../middleware/authMiddleware.js";
import {
  createContact,
  contactList,
  getContactById,
  deleteContact,
  updateContact,
} from "../controllers/contactController.js";
const router = express.Router();

// create contact
router.post("/save", ...orgadminOrAdmin, createContact);

// get contact list
router.post("/list", ...orgadminOrAdmin, contactList);

// get contact by id
router.get("/get/:id", ...orgadminOrAdmin, getContactById);

// delete contact
router.delete("/delete/:id", ...orgadminOrAdmin, deleteContact);

// update contact
router.put("/update/:id", ...orgadminOrAdmin, updateContact);

export default router;
