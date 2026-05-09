import Student from "../model/studentModel.js";
import FeeLedgerModel from "../model/FeeLedgerModel.js";
import { createAutoLedger } from "./FeeLedgerController.js";
import ExcelJS from "exceljs";
import cloudinary from "../config/cloudinary.js";
import { cleanupRequestFiles } from "../utils/fileCleanup.js";

export const createStudent = async (req, res, next) => {
  try {
    // 🔴 Parse multipart JSON safely
    if (req.body.feeBenefit)
      req.body.feeBenefit = JSON.parse(req.body.feeBenefit);
    if (req.body.recommendedFees)
      req.body.recommendedFees = JSON.parse(req.body.recommendedFees);

    const body = req.body;

    // 🔹 Clean empty optional fields
    ["aadharNo", "penNo", "dob", "gender"].forEach((field) => {
      if (body[field] === "" || body[field] === null) {
        delete body[field];
      }
    });

    // ✅ 1. REQUIRED FIELDS (as per new schema)
    const validations = [
      { field: "studentName", message: "Student Name is required" },
      { field: "session", message: "Academic Session is required" },
      { field: "className", message: "Class Name is required" },
    ];

    for (const v of validations) {
      if (!body[v.field] || body[v.field].toString().trim() === "") {
        cleanupRequestFiles(req);
        return res.status(400).json({ success: false, message: v.message });
      }
    }

    // ✅ 2. UNIQUE CHECK (only if value provided)
    const orConditions = [];
    if (body.penNo) orConditions.push({ penNo: body.penNo });
    if (body.aadharNo) orConditions.push({ aadharNo: body.aadharNo });

    if (orConditions.length) {
      const existingStudent = await Student.findOne({ $or: orConditions });

      if (existingStudent) {
        cleanupRequestFiles(req);
        let duplicateField =
          existingStudent.penNo === body.penNo
            ? "PEN Number"
            : "Aadhar Number";
        return res.status(400).json({
          success: false,
          message: `${duplicateField} already registered`,
        });
      }
    }

    // ✅ 3. Serial No generation
    const lastStudent = await Student.findOne()
      .sort({ serialNo: -1 })
      .select("serialNo");

    body.serialNo =
      body.serialNo || (lastStudent ? lastStudent.serialNo + 1 : 1);

    // ✅ 4. Create Student
    const student = new Student(body);

    // Fee Benefit Logic
    if (body.feeBenefit?.hasFeeBenefit === true) {
      student.feeBenefit = {
        hasFeeBenefit: true,
        description: body.feeBenefit.description || "",
        approvedAt: new Date(),
      };
    }

    // ✅ 5. Upload Photos
    const uploadPhoto = async (fileArray, folder, publicIdPrefix) => {
      if (fileArray && fileArray[0]) {
        const result = await cloudinary.uploader.upload(fileArray[0].path, {
          folder,
          public_id: `${publicIdPrefix}_${body.serialNo}`,
          overwrite: true,
        });
        return result.secure_url;
      }
      return null;
    };

    if (req.files?.photo)
      student.photo = await uploadPhoto(
        req.files.photo,
        "students/photo",
        "student",
      );

    if (req.files?.fatherPhoto)
      student.fatherPhoto = await uploadPhoto(
        req.files.fatherPhoto,
        "students/father",
        "father",
      );

    if (req.files?.motherPhoto)
      student.motherPhoto = await uploadPhoto(
        req.files.motherPhoto,
        "students/mother",
        "mother",
      );

    await student.save();

    // ✅ 6. Auto Ledger
    await createAutoLedger(student, body.recommendedFees || []);
    cleanupRequestFiles(req);

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    console.error(error);
    cleanupRequestFiles(req);
    next(error);
  }
};

//STUDENT BULK UPLOADER
export const bulkStudentApplyController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload Excel file",
      });
    }

    const workbook = new ExcelJS.Workbook();
    if (req.file.mimetype === "text/csv") {
      await workbook.csv.load(req.file.buffer);
    } else {
      await workbook.xlsx.load(req.file.buffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: "Invalid Excel file",
      });
    }

    // 🔹 Normalize headers
    const headers = worksheet
      .getRow(1)
      .values.slice(1)
      .map((h) =>
        (h || "")
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, ""),
      );

    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = row.values.slice(1);
      const obj = {};
      headers.forEach((h, i) => (obj[h] = values[i] ?? null));
      rows.push(obj);
    });

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty",
      });
    }

    // 🔹 Fetch existing
    const existingStudents = await Student.find(
      {},
      "serialNo penNo aadharNo",
    ).lean();

    const existingSerials = new Set(existingStudents.map((s) => s.serialNo));
    const existingPens = new Set(
      existingStudents.map((s) => s.penNo).filter(Boolean),
    );
    const existingAadhars = new Set(
      existingStudents.map((s) => s.aadharNo).filter(Boolean),
    );

    const studentsToInsert = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const serialNo = row.serialno ? Number(row.serialno) : null;
      const penNo = row.penno ? String(row.penno).trim() : null;
      const aadharNo = row.aadharno ? String(row.aadharno).trim() : null;

      if (!serialNo) {
        errors.push(`Row ${i + 2}: Serial No missing`);
        continue;
      }

      if (existingSerials.has(serialNo)) {
        errors.push(`Row ${i + 2}: Serial No already exists`);
        continue;
      }

      if (penNo && existingPens.has(penNo)) {
        errors.push(`Row ${i + 2}: PEN No already exists`);
        continue;
      }

      if (aadharNo && existingAadhars.has(aadharNo)) {
        errors.push(`Row ${i + 2}: Aadhar already exists`);
        continue;
      }

      const studentData = {
        serialNo,
        penNo,
        aadharNo,

        studentName: row.studentname?.trim(),
        fatherName: row.fathername || null,
        motherName: row.mothername || null,

        dob: row.dob || null,
        gender: row.gender || null,

        mobile: row.mobile || null,
        photo: row.photo || null,

        session: row.session,
        className: row.class || row.classname,
        section: row.section || null,
        rollNo: row.rollno || null,

        address1: row.address1 || null,
        address2: row.address2 || null,
        city: row.city || null,

        religion: row.religion || null,
        category: row.category || null,
        bloodGroup: row.bloodgroup || null,

        transport: row.transport || "N/A",
        vehicle: row.vehicle || "N/A",
        discount: row.discount || "N/A",

        tc: row.tc || "No",
        charCert: row.charcert || "No",
        reportCard: row.reportcard || "No",
        dobCert: row.dobcert || "No",
      };

      // ✅ REQUIRED as per new schema
      if (!studentData.studentName || !studentData.session || !studentData.className) {
        errors.push(`Row ${i + 2}: Missing required fields`);
        continue;
      }

      studentsToInsert.push(studentData);
      existingSerials.add(serialNo);
      if (penNo) existingPens.add(penNo);
      if (aadharNo) existingAadhars.add(aadharNo);
    }

    const insertedStudents = await Student.insertMany(studentsToInsert, {
      ordered: false,
    });

    for (const student of insertedStudents) {
      try {
        await createAutoLedger(student);
      } catch (e) {
        errors.push(`Ledger error for ${student.studentName}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk upload completed",
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

// 🔍 Get Single Student (with Recommended Fee if applicable)
export const getSingleStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    let recommendedFees = [];

    // ✅ If student has fee benefit → fetch recommended fees
    if (student?.feeBenefit?.hasFeeBenefit === true) {
      const ledger = await FeeLedgerModel.findOne({
        studentId: student._id,
      }).select("recommendedFees");

      if (ledger?.recommendedFees?.length > 0) {
        recommendedFees = ledger.recommendedFees;
      }
    }

    res.status(200).json({
      success: true,
      message: "Student found",
      student,
      recommendedFees, // 👈 frontend ko direct mil jayega
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
