import mongoose from "mongoose";

const ReceiptSchema = new mongoose.Schema({
  receiptNo: {
    type: String,
    required: true, // RCPT-2026-00001
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },

  studentName: { type: String, required: true },
  fatherName: { type: String, required: true },
  className: { type: String, required: true },
  section: { type: String },
  rollNo: { type: String },

  // Fee breakup
  tuitionFee: { type: Number, default: 0 },
  admissionFee: { type: Number, default: 0 },
  annualFee: { type: Number, default: 0 },
  transportFee: { type: Number, default: 0 },

  // Extra/custom fees
  extraFees: [
    {
      title: { type: String },
      amount: { type: Number },
    },
  ],

  // Final calculation
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  dueAmount: { type: Number, default: 0 },

  paymentMode: {
    type: String,
    enum: ["Cash", "UPI", "Card", "Cheque", "Bank Transfer"],
    required: true,
  },

  // Multiple months support
  months: [
    {
      type: String, // January-2026
    },
  ],

  year: {
    type: Number,
    required: true,
  },

  // PDF file
  fileName: {
    type: String, // receipt_RCPT-2026-00001.pdf
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Receipt", ReceiptSchema);
