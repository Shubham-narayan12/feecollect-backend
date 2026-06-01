// models/galleryModel.js

import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    // ===============================
    // IMAGE TITLE
    // ===============================
    imageTitle: {
      type: String,
      required: [true, "Image title is required"],
      trim: true,
    },

    // ===============================
    // IMAGE CATEGORY
    // ===============================
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    // ===============================
    // IMAGE URL
    // ===============================
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },

    // ===============================
    // CLOUDINARY PUBLIC ID
    // (important for delete)
    // ===============================
    publicId: {
      type: String,
      required: true,
    },

    // ===============================
    // STATUS
    // ===============================
    isActive: {
      type: Boolean,
      default: true,
    },
  },

  // ===============================
  // AUTO TIMESTAMPS
  // ===============================
  {
    timestamps: true,
  },
);

// ===============================
// INDEXES (Professional)
// ===============================

gallerySchema.index({ category: 1 });

gallerySchema.index({ createdAt: -1 });

// ===============================
// MODEL
// ===============================

const galleryModel = mongoose.model("Gallery", gallerySchema);

export default galleryModel;
