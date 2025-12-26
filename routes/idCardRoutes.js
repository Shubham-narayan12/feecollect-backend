import express from "express";
import multer from "multer";
import { uploadParentPhotoZip } from "../controller/parentPhotoController.js";
import {
  downloadIDCardPDF,
  generateBulkIDCards,
} from "../controller/idCardController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

//UPLOAD PARENTS PHOTOS
router.post(
  "/parent-photos/upload-zip",
  upload.single("zip"),
  uploadParentPhotoZip
);

//GENERATE BULK ID CARD
router.post("/generate/bulk", generateBulkIDCards);

//Download ID card PDF
router.get("/download/:fileName", downloadIDCardPDF);

export default router;
