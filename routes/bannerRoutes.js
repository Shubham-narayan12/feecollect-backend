// routes/bannerRoutes.js

import express from "express";

import {
  createBanner,
  deleteBanner,
  getAllBanner,
} from "../controller/bannerController.js";
import { uploadBanner } from "../middleware/upload.js";

// router object
const router = express.Router();

// ================= CREATE BANNER =================
router.post("/create-banner", uploadBanner, createBanner);

// ================= GET ALL BANNERS =================
router.get("/get-all-banner", getAllBanner);

// ================= DELETE BANNER =================
router.delete("/delete-banner/:id", deleteBanner);

export default router;
