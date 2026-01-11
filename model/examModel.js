import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // "Half Yearly", "Annual"
    },

    year: {
      type: Number,
      required: true, // 2025
    },

    class: {
      type: String,
      required: true,
    },

    section: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);
