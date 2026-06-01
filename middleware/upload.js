// middlewares/upload.js

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use /tmp directory for Vercel (serverless) or uploads/temp for local
const uploadDir = process.env.VERCEL
  ? "/tmp"
  : path.join(process.cwd(), "uploads", "temp");

// Ensure directory exists (only needed for local development)
if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// ================= STUDENT PHOTOS =================

export const uploadStudentPhotos = multer({ storage }).fields([
  { name: "photo", maxCount: 1 },
  { name: "fatherPhoto", maxCount: 1 },
  { name: "motherPhoto", maxCount: 1 },
]);

// ================= BANNER =================

export const uploadBanner = multer({ storage }).single("banner");

// ================= GALLERY =================

export const uploadGalleryImage = multer({ storage }).single("image");
