import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // 👦 Basic Info
    serialNo: {
      type: Number,
      unique: true,
    },
    studentName: { type: String, required: true }, // name
    fatherName: { type: String, required: true },
    motherName: { type: String },

    dob: { type: String, required: true },
    gender: {
      type: String,
      enum: ["Boy", "Girl", "Other"],
      required: true,
    },

    aadharNo: { type: String, required: true, unique: true },
    mobile: { type: String },
    fatherPhoto: {
      type: String,
      default: null,
    },

    motherPhoto: {
      type: String,
      default: null,
    },

    // 🏫 Academic Info
    session: { type: String, required: true },
    className: { type: String, required: true }, // class
    section: { type: String },
    rollNo: { type: String }, // regNo

    admissionDate: { type: String },

    // 🏠 Address
    address1: { type: String },
    address2: { type: String },
    city: { type: String },

    // 👥 Personal Details
    religion: { type: String },
    category: { type: String },
    bloodGroup: { type: String },

    // 🚌 Transport
    transport: {
      type: String,
      default: "N/A",
    },
    vehicle: { type: String, default: "N/A" },

    // 💰 Fee / Discount
    discount: { type: String, default: "N/A" },

    // 📄 Documents
    tc: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    charCert: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    reportCard: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    dobCert: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    // 🖼️ Student Photo
    photo: { type: String, default: null }, // file path / url

    // 🔗 Ledger Reference (IMPORTANT – keep this)
    ledgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeLedger",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
