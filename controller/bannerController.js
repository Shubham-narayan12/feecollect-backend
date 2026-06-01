import bannerModel from "../model/bannerModel.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// ===============================
// UPLOAD BANNER
// ===============================

export const createBanner = async (req, res) => {
  try {
    const { bannerTitle } = req.body;

    // validation
    if (!bannerTitle) {
      return res.status(400).json({
        success: false,
        message: "Banner title is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    // ===============================
    // UPLOAD TO CLOUDINARY
    // ===============================

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "gfs 2026-27",
    });

    // ===============================
    // DELETE LOCAL TEMP FILE
    // ===============================

    fs.unlinkSync(req.file.path);

    // ===============================
    // SAVE IN DATABASE
    // ===============================

    const newBanner = await bannerModel.create({
      bannerTitle,
      photoUrl: result.secure_url,
    });

    res.status(201).json({
      success: true,
      message: "Banner uploaded successfully",
      banner: newBanner,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET ALL BANNERS
// ===============================

export const getAllBanner = async (req, res) => {
  try {
    const banners = await bannerModel.find().sort({ _id: -1 });

    res.status(200).json({
      success: true,
      totalBanner: banners.length,
      banners,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// DELETE BANNER
// ===============================

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await bannerModel.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // ===============================
    // EXTRACT PUBLIC ID
    // ===============================

    const imageUrl = banner.photoUrl;

    const urlArr = imageUrl.split("/");

    const image = urlArr[urlArr.length - 1];

    const imageName = image.split(".")[0];

    const publicId = `gfs 2026-27/${imageName}`;

    // ===============================
    // DELETE FROM CLOUDINARY
    // ===============================

    await cloudinary.uploader.destroy(publicId);

    // ===============================
    // DELETE FROM DATABASE
    // ===============================

    await bannerModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
