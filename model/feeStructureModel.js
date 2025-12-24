import mongoose from "mongoose";

const ExtraFeeSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. "Sports Fee"
  amount: { type: Number, required: true }, // e.g. 500
});

const FeeStructureSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true, // each class only one structure allowed
      trim: true,
    },

    admissionFee: { type: Number, required: true },
    tuitionFee: { type: Number, required: true },
    annuFalFee: { type: Number, required: true },
    examee: { type: Number, required: true },
    transportFee: { type: Number, default: 0 }, // Some classes don't use transport

    extraFees: {
      type: [ExtraFeeSchema], // multiple optional fees
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("FeeStructure", FeeStructureSchema);
