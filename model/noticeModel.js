import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    notice: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // automatically createdAt & updatedAt save karega
  }
);

const noticeModel = mongoose.model("Notice", noticeSchema);

export default noticeModel;