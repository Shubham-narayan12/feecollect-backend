import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true, // "Maths"
  },
  marks: {
    type: Number,
    required: true,
  },
  maxMarks: {
    type: Number,
    default: 100,
  },
  grade: {
    type: String,
  },
});

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    class: {
      type: String,
      required: true,
    },

    section: {
      type: String,
      required: true,
    },

    rollNo: {
      type: Number,
      required: true,
    },

    subjects: [subjectSchema],

    totalMarks: Number,
    maxTotal: Number,
    percentage: Number,
    divison: { type: String, default: "N/A" },

    resultStatus: {
      type: String,
      enum: ["PASS", "FAIL"],
      default: "PASS",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Result", resultSchema);
