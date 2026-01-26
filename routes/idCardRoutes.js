import express from "express";
import multer from "multer";
import { uploadParentPhotoZip } from "../controller/parentPhotoController.js";
import {
  downloadIDCardPDF,
  generateBulkIDCardBackByCount,
  generateBulkIDCards,
  generateBulkIDCardsByClassSection,
} from "../controller/idCardController.js";

const router = express.Router();

// Use /tmp for Vercel serverless environment
const uploadDir = process.env.VERCEL ? "/tmp" : "uploads/";
const upload = multer({ dest: uploadDir });

//UPLOAD PARENTS PHOTOS
router.post(
  "/parent-photos/upload-zip",
  upload.single("zip"),
  uploadParentPhotoZip,
);

//GENERATE BULK ID CARD
router.post("/generate/bulk", generateBulkIDCards);

//GENERATE BULK CLASSWISE IDCARD
router.post("/generate/classwise", generateBulkIDCardsByClassSection);

//GENERATE BACK OF IDCARD
router.post("/generate/idcard-back", generateBulkIDCardBackByCount);

//Download ID card PDF
router.get("/download/:fileName", downloadIDCardPDF);

export default router;
