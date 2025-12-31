import express from "express";
import { createMailTemplate } from "../controllers/mailTemplateController.js";

const router = express.Router();

router.post("/create", createMailTemplate);

export default router;
