// routes/galleryRoutes.js

import express from "express";


import {
  createGallery,
  deleteGallery,
  getAllGallery,
  getSingleGallery,
  updateGallery,
} from "../controller/galleryController.js";
import { uploadGalleryImage } from "../middleware/upload.js";

// ==========================================
// ROUTER OBJECT
// ==========================================

const router = express.Router();

// ==========================================
// CREATE GALLERY
// ==========================================

router.post("/create-gallery", uploadGalleryImage, createGallery);

// ==========================================
// GET ALL GALLERY
// ==========================================

router.get("/get-all-galleryImages", getAllGallery);

// ==========================================
// GET SINGLE GALLERY
// ==========================================

router.get("/get-single-galleryImage/:id", getSingleGallery);

// ==========================================
// UPDATE GALLERY
// ==========================================

router.put("/update-galleryImage/:id", uploadGalleryImage, updateGallery);

// ==========================================
// DELETE GALLERY
// ==========================================

router.delete("/delete-galleryImage/:id", deleteGallery);

export default router;
