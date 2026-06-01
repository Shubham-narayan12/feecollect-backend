// ==========================================
// routes/noticeRoutes.js
// ==========================================

import express from "express";
import {
  createNotice,
  deleteNotice,
  getAllNotice,
  getSingleNotice,
  updateNotice,
} from "../controller/noticeController.js";

const router = express.Router();

router.post("/create-notice", createNotice);

router.get("/get-all-notice", getAllNotice);

router.get("/get-single-notice/:id", getSingleNotice);

router.put("/update-notice/:id", updateNotice);

router.delete("/delete-notice/:id", deleteNotice);

export default router;
