import mongoose from "mongoose";

const MonthlyRecordSchema = new mongoose.Schema({
  month: { type: String, required: true }, // "April", "May"
  year: { type: Number, required: true }, // 2025
  tuitionFee: { type: Number, default: 0 },
  transportFee: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["Paid", "Unpaid", "Partial"],
    default: "paid",
  },
  paidAmount: { type: Number, default: 0 },
});

const ExtraFeeSchema = new mongoose.Schema({
  title: { type: String, required: true }, // "Exam Fee", "Uniform" ,"extra fee"
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Paid", "Unpaid"],
    default: "Unpaid",
  },
});

const RecommendedFeeSchema = new mongoose.Schema({
  feeType: {
    type: String, //tution fee
    required: true,
  },

  amount: {
    type: Number, //500
    required: true,
  },
});

const FeeLedgerSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },

    session: { type: String, required: true }, // "2024-2025"
    className: { type: String, required: true }, // "5"
    section: { type: String },

    // 💰 Admission / Annual Fee
    admissionFee: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ["Paid", "Unpaid", "Partial"],
        default: "Unpaid",
      },
      paidAmount: { type: Number, default: 0 },
      dueAmount: { type: Number, default: 0 },
    },
    annualFee: {
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ["Paid", "Unpaid", "Partial"],
        default: "Unpaid",
      },
      paidAmount: { type: Number, default: 0 },
      dueAmount: { type: Number, default: 0 },
    },

    // 🧾 Monthly Records for Tuition + Transport
    monthlyRecords: { type: [MonthlyRecordSchema], default: [] },

    // 🧩 Exam Fee, Uniform, Books etc
    extraFees: { type: [ExtraFeeSchema], default: [] },

    recommendedFees: {
      type: [RecommendedFeeSchema],
      default: [],
    },

    // 📊 Final Summary
    paymentHistory: [
      {
        paidAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, default: 0 },
        date: { type: Date },
      },
    ],
    lastPaymentDate: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("FeeLedger", FeeLedgerSchema);
