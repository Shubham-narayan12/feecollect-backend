import Student from "../model/studentModel.js";
import { createAutoLedger } from "./FeeLedgerController.js";
import ExcelJS from "exceljs";

//CREATE STUDENT
export const createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);

    // Auto Ledger create
    await createAutoLedger(student);

    res.status(201).json({
      success: true,
      message: "Student created + Ledger initialized",
      data: student,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// BULK STUDENT APPLY
export const bulkStudentApplyController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload Excel file",
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: "Invalid Excel file",
      });
    }

    // ✅ Header normalize
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values.slice(1).map((h) =>
      (h || "")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
    );

    const rows = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = row.values.slice(1);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] !== undefined ? values[i] : null;
      });
      rows.push(obj);
    });

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    // ✅ Existing Aadhar fetch
    const existingStudents = await Student.find({}, "aadharNo");
    const existingAadhars = new Set(
      existingStudents.map((s) => s.aadharNo.trim())
    );

    let successCount = 0;
    let skipCount = 0;
    const errors = [];
    const studentsToInsert = [];

    // =========================
    // 🔁 ROW PROCESSING
    // =========================
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];

        if (!row.aadharno) {
          errors.push(`Row ${i + 2}: Aadhar number missing`);
          skipCount++;
          continue;
        }

        const aadharNo = String(row.aadharno).trim();
        if (existingAadhars.has(aadharNo)) {
          errors.push(`Row ${i + 2}: Aadhar already exists (${aadharNo})`);
          skipCount++;
          continue;
        }

        const studentData = {
          studentName: row.studentname || "",
          fatherName: row.fathername || "",
          motherName: row.mothername || "",
          dob: row.dob || "",
          gender: row.gender || "",
          aadharNo,
          mobile: row.mobile || "",

          session: row.session || "",
          className: row.class || row.classname || "",
          section: row.section || "",
          rollNo: row.rollno || row.regno || "",

          admissionDate: row.admissiondate || "",

          address1: row.address1 || "",
          address2: row.address2 || "",
          city: row.city || "",

          religion: row.religion || "",
          category: row.category || "",
          bloodGroup: row.bloodgroup || "",

          transport: row.transport || "N/A",
          vehicle: row.vehicle || "N/A",
          discount: row.discount || "N/A",

          tc: row.tc || "No",
          charCert: row.charcert || "No",
          reportCard: row.reportcard || "No",
          dobCert: row.dobcert || "No",

          photo: row.photo || "N/A",
        };

        const requiredFields = [
          "studentName",
          "fatherName",
          "dob",
          "gender",
          "session",
          "className",
          "aadharNo",
        ];

        const missing = requiredFields.filter((field) => !studentData[field]);

        if (missing.length > 0) {
          errors.push(`Row ${i + 2}: Missing fields - ${missing.join(", ")}`);
          skipCount++;
          continue;
        }

        studentsToInsert.push(studentData);
        existingAadhars.add(aadharNo);
        successCount++;
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
        skipCount++;
      }
    }

    // =========================
    // 💾 INSERT + LEDGER CREATE
    // =========================
    let insertedStudents = [];

    if (studentsToInsert.length > 0) {
      try {
        insertedStudents = await Student.insertMany(studentsToInsert, {
          ordered: false,
        });
      } catch (dbError) {
        if (dbError.writeErrors) {
          insertedStudents = dbError.result?.insertedDocs || [];
          dbError.writeErrors.forEach((e) =>
            errors.push(`DB Error: ${e.errmsg}`)
          );
        } else {
          throw dbError;
        }
      }
    }

    // 🔥 AUTO LEDGER CREATION
    for (const student of insertedStudents) {
      try {
        await createAutoLedger(student);
      } catch (ledgerError) {
        errors.push(
          `Ledger Error (${student.studentName}): ${ledgerError.message}`
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk upload completed with auto ledger creation",
      totalRows: rows.length,
      inserted: insertedStudents.length,
      skipped: rows.length - insertedStudents.length,
      errors: errors.length ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("Bulk student upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//SEARCH STUDENT BY SESSION, CLASS, ROLLNO and STDEUNT NAME
export const searchStudent = async (req, res) => {
  try {
    const { session, className, section, rollNo, studentName } = req.body;

    let query = {};

    if (session) query.session = session;
    if (className) query.className = className;
    if (rollNo) query.rollNo = rollNo;
    if (section) query.section = section;

    // Name partial match (case-insensitive)
    if (studentName) query.studentName = { $regex: studentName, $options: "i" };

    const students = await Student.find(query).populate("ledgerId");

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📄 Get All Students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("ledgerId");

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔍 Get Single Student
export const getSingleStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("ledgerId");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student found",
      student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✏️ Update Student
export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🗑️ Delete Student
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
