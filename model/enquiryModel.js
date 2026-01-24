import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
  },
  //   subject: {
  //     type: String,
  //   },
  message: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const enquiryModel = mongoose.model("Enquirys", enquirySchema);
export default enquiryModel;
