// controllers/galleryController.js

import fs from "fs";

import cloudinary from "../config/cloudinary.js";
import galleryModel from "../model/galleryModel.js";

// ==========================================
// CREATE GALLERY IMAGE
// ==========================================

export const createGallery = async (req, res) => {
  try {
    const { imageTitle, category } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!imageTitle) {
      return res.status(400).json({
        success: false,
        message: "Image title is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Gallery image is required",
      });
    }

    // ===============================
    // UPLOAD TO CLOUDINARY
    // ===============================

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "gfs 2026-27",
    });

    // ===============================
    // DELETE TEMP FILE
    // ===============================

    fs.unlinkSync(req.file.path);

    // ===============================
    // SAVE TO DATABASE
    // ===============================

    const newGallery = await galleryModel.create({
      imageTitle,
      category,
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });

    res.status(201).json({
      success: true,
      message: "Gallery image uploaded successfully",
      gallery: newGallery,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL GALLERY IMAGES
// ==========================================

export const getAllGallery = async (req, res) => {
  try {
    const galleries = await galleryModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalGallery: galleries.length,
      galleries,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET SINGLE GALLERY IMAGE
// ==========================================

export const getSingleGallery = async (req, res) => {
  try {
    const { id } = req.params;

    const gallery = await galleryModel.findById(id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    res.status(200).json({
      success: true,
      gallery,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE GALLERY IMAGE
// ==========================================

export const deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;

    const gallery = await galleryModel.findById(id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    // ===============================
    // DELETE FROM CLOUDINARY
    // ===============================

    await cloudinary.uploader.destroy(gallery.publicId);

    // ===============================
    // DELETE FROM DATABASE
    // ===============================

    await galleryModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Gallery image deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE GALLERY IMAGE
// ==========================================

export const updateGallery = async (req, res) => {
  try {
    const { id } = req.params;

    const { imageTitle, category } = req.body;

    const gallery = await galleryModel.findById(id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    let imageUrl = gallery.imageUrl;

    let publicId = gallery.publicId;

    // ===============================
    // IF NEW IMAGE PROVIDED
    // ===============================

    if (req.file) {
      // delete old image
      await cloudinary.uploader.destroy(gallery.publicId);

      // upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "gfs 2026-27/gallery",
      });

      // delete temp file
      fs.unlinkSync(req.file.path);

      imageUrl = result.secure_url;

      publicId = result.public_id;
    }

    // ===============================
    // UPDATE DATABASE
    // ===============================

    const updatedGallery = await galleryModel.findByIdAndUpdate(
      id,
      {
        imageTitle,
        category,
        imageUrl,
        publicId,
      },
      {
        new: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Gallery updated successfully",
      gallery: updatedGallery,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
