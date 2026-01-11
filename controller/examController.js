// createExam.js
import Exam from "../model/examModel.js";

//CREATE EXAM
export const createExam = async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json({
      success: true,
      exam,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
