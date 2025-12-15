import express from "express";
import {
  createStudent,
  deleteStudent,
  getAllStudents,
  getSingleStudent,
  searchStudent,
  updateStudent
} from "../controller/studentController.js";

const router = express.Router();

// ➕ Create Student
router.post("/create", createStudent);

//SERACH STUDENT BY SESSION, ROLL NO, CLASS AND NAME
router.post("/search", searchStudent);

// 📄 Get All Students
router.get("/all", getAllStudents);

// 🔍 Get Single Student by ID
router.get("/:id", getSingleStudent);

// ✏️ Update Student by ID
router.put("/:id", updateStudent);

// 🗑️ Delete Student by ID
router.delete("/:id", deleteStudent);

export default router;
