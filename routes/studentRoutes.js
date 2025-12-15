import express from "express";
import multer from "multer";
import {
  bulkStudentApplyController,
  createStudent,
  deleteStudent,
  getAllStudents,
  getSingleStudent,
  searchStudent,
  updateStudent,
} from "../controller/studentController.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ➕ Create Student
router.post("/create", createStudent);

//BULK ADD BY EXCEL
router.post("/bulk-apply", upload.single("file"), bulkStudentApplyController);

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
