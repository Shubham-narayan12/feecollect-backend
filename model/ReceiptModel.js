import mongoose from "mongoose";

const ReceiptSchema = new mongoose.Schema({
  receiptNo: { type: String, required: true }, // RCPT-2025-00001

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },

  studentName: { type: String, required: true },
  className: { type: String, required: true },
  section: { type: String },

  // fee breakup
  tuitionFee: { type: Number, default: 0 },
  admissionFee: { type: Number, default: 0 },
  annualFee: { type: Number, default: 0 },
  examFee: { type: Number, default: 0 },
  transportFee: { type: Number, default: 0 },

  // Extra / custom fees from admin
  extraFees: [
    {
      title: String,
      amount: Number,
    },
  ],

  // Discount / scholarship
  discount: { type: Number, default: 0 },
  scholarship: { type: Number, default: 0 },

  // Final amount
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  dueAmount: { type: Number, default: 0 },

  paymentMode: {
    type: String,
    enum: ["Cash", "UPI", "Card", "Cheque", "Bank Transfer"],
    required: true,
  },

  month: { type: String, required: true }, // April
  year: { type: Number, required: true }, // 2025

  // For PDF download (set after generation)
  pdfUrl: { type: String },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Receipt", ReceiptSchema);
