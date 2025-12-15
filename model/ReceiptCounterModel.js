import mongoose from "mongoose";

const ReceiptCounterSchema = new mongoose.Schema({
  prefix: { type: String, default: "RCPT" },  // RCPT-00001
  year: { type: Number, required: true },      // e.g. 2025
  lastNumber: { type: Number, default: 0 },    // last generated receipt number
});

export default mongoose.model("ReceiptCounter", ReceiptCounterSchema);
