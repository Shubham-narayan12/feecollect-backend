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

/**
 * Bulk import students from Excel file
 * Excel columns should match Student model fields
 */
export const bulkImportStudents = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an Excel file",
        errorCode: "NO_FILE",
      });
    }

    // 2. Check file type
    const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: "Only Excel files (xlsx, xls, csv) are allowed",
        errorCode: "INVALID_FILE_TYPE",
      });
    }

    // 3. Load workbook
    const workbook = new ExcelJS.Workbook();

    if (fileExtension === "csv") {
      await workbook.csv.read(req.file.buffer);
    } else {
      await workbook.xlsx.load(req.file.buffer);
    }

    // 4. Get first worksheet
    const worksheet = workbook.worksheets[0];
    const totalRows = worksheet.rowCount;

    if (totalRows <= 1) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty (no data rows)",
        errorCode: "NO_DATA",
      });
    }

    // 5. Process headers - map Excel columns to model fields
    const headerRow = worksheet.getRow(1);
    const excelHeaders = headerRow.values.slice(1); // Skip first empty cell

    // Define field mapping - Excel column names to model field names
    const fieldMapping = {
      // Personal Information
      student_name: "studentName",
      name: "studentName",
      student: "studentName",

      father_name: "fatherName",
      father: "fatherName",

      mother_name: "motherName",
      mother: "motherName",

      date_of_birth: "dob",
      dob: "dob",
      birth_date: "dob",

      gender: "gender",
      sex: "gender",

      // Contact Information
      aadhar: "aadharNo",
      aadhar_no: "aadharNo",
      aadhar_number: "aadharNo",
      aadharno: "aadharNo",

      mobile: "mobile",
      mobile_no: "mobile",
      phone: "mobile",
      contact: "mobile",

      email: "email",
      email_id: "email",
      emailid: "email",

      // Address
      address: "address",
      residence: "address",
      full_address: "address",

      city: "city",
      town: "city",

      state: "state",
      province: "state",

      pincode: "pincode",
      pin_code: "pincode",
      zipcode: "pincode",
      postal_code: "pincode",

      // Academic Details
      admission_date: "admissionDate",
      admission: "admissionDate",
      enrollment_date: "admissionDate",

      session: "session",
      academic_year: "session",
      year: "session",

      class: "className",
      class_name: "className",
      standard: "className",
      grade: "className",

      section: "section",
      division: "section",
      group: "section",

      roll_no: "rollNo",
      roll_number: "rollNo",
      roll: "rollNo",
    };

    // Normalize headers and create mapping
    const columnToFieldMap = {};
    excelHeaders.forEach((header, index) => {
      if (!header) return;

      const normalizedHeader = header
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      if (fieldMapping[normalizedHeader]) {
        columnToFieldMap[index] = fieldMapping[normalizedHeader];
      } else {
        // Try direct match with model field names
        const modelField = Object.keys(studentSchema.paths).find(
          (field) => field.toLowerCase() === normalizedHeader
        );
        if (modelField) {
          columnToFieldMap[index] = modelField;
        }
      }
    });

    // 6. Check for required fields
    const requiredFields = [
      "studentName",
      "fatherName",
      "dob",
      "gender",
      "aadharNo",
      "session",
      "className",
    ];
    const missingRequiredColumns = requiredFields.filter(
      (field) => !Object.values(columnToFieldMap).includes(field)
    );

    if (missingRequiredColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingRequiredColumns.join(
          ", "
        )}`,
        errorCode: "MISSING_REQUIRED_COLUMNS",
        details: {
          required: requiredFields,
          found: Object.values(columnToFieldMap),
        },
      });
    }

    // 7. Get existing Aadhar numbers for duplicate check
    const existingAadhars = await Student.distinct("aadharNo");
    const aadharSet = new Set(existingAadhars.map((a) => a?.toString().trim()));

    // 8. Process rows
    const studentsToInsert = [];
    const errors = [];
    const skippedRows = [];
    const duplicateAadharsInFile = new Set();

    for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const rowData = {};
      const rowErrors = [];

      try {
        // Extract data based on column mapping
        Object.entries(columnToFieldMap).forEach(([colIndex, fieldName]) => {
          const cell = row.getCell(parseInt(colIndex) + 1);
          let value = cell.value;

          // Convert Excel date to string
          if (value instanceof Date) {
            value = value.toISOString().split("T")[0]; // YYYY-MM-DD
          } else if (value && typeof value === "object" && value.text) {
            value = value.text; // Handle rich text cells
          }

          rowData[fieldName] =
            value !== undefined && value !== null
              ? value.toString().trim()
              : "";
        });

        // Skip empty rows
        if (Object.values(rowData).every((val) => val === "")) {
          skippedRows.push(rowNumber);
          continue;
        }

        // Validate required fields
        requiredFields.forEach((field) => {
          if (!rowData[field] || rowData[field].trim() === "") {
            rowErrors.push(`${field} is required`);
          }
        });

        // Validate Aadhar
        if (rowData.aadharNo) {
          const aadhar = rowData.aadharNo.trim();

          // Check duplicates in database
          if (aadharSet.has(aadhar)) {
            rowErrors.push(`Aadhar ${aadhar} already exists in system`);
          }

          // Check duplicates in current file
          if (duplicateAadharsInFile.has(aadhar)) {
            rowErrors.push(`Duplicate Aadhar in this file`);
          } else {
            duplicateAadharsInFile.add(aadhar);
          }

          // Validate Aadhar format (12 digits)
          if (!/^\d{12}$/.test(aadhar)) {
            rowErrors.push("Aadhar must be exactly 12 digits");
          }
        }

        // Validate mobile (if provided)
        if (rowData.mobile && rowData.mobile.trim() !== "") {
          const mobile = rowData.mobile.trim();
          if (!/^[6-9]\d{9}$/.test(mobile)) {
            rowErrors.push(
              "Invalid mobile number (10 digits starting with 6-9)"
            );
          }
        }

        // Validate email (if provided)
        if (rowData.email && rowData.email.trim() !== "") {
          const email = rowData.email.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            rowErrors.push("Invalid email format");
          }
          rowData.email = email;
        }

        // Validate gender
        if (rowData.gender) {
          const validGenders = ["Male", "Female", "Other"];
          const gender = rowData.gender.trim();
          if (!validGenders.includes(gender)) {
            rowErrors.push(`Gender must be one of: ${validGenders.join(", ")}`);
          }
        }

        // Validate rollNo (if provided)
        if (rowData.rollNo && rowData.rollNo.trim() !== "") {
          const rollNo = parseInt(rowData.rollNo);
          if (isNaN(rollNo)) {
            rowErrors.push("Roll number must be a valid number");
          } else {
            rowData.rollNo = rollNo;
          }
        }

        // If errors, skip this row
        if (rowErrors.length > 0) {
          errors.push({
            row: rowNumber,
            data: rowData,
            errors: rowErrors,
          });
          continue;
        }

        // Clean data - remove empty strings for optional fields
        const optionalFields = [
          "motherName",
          "mobile",
          "email",
          "address",
          "city",
          "state",
          "pincode",
          "admissionDate",
          "section",
          "rollNo",
        ];

        optionalFields.forEach((field) => {
          if (rowData[field] === "") {
            delete rowData[field];
          }
        });

        // Add to batch
        studentsToInsert.push(rowData);
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: `Processing error: ${error.message}`,
          data: rowData,
        });
      }
    }

    // 9. Insert into database
    let insertedCount = 0;
    let failedInserts = [];

    if (studentsToInsert.length > 0) {
      try {
        // Insert in batches of 100
        const BATCH_SIZE = 100;
        for (let i = 0; i < studentsToInsert.length; i += BATCH_SIZE) {
          const batch = studentsToInsert.slice(i, i + BATCH_SIZE);
          const result = await Student.insertMany(batch, { session });
          insertedCount += result.length;
        }

        await session.commitTransaction();
      } catch (insertError) {
        await session.abortTransaction();

        // Handle duplicate key errors
        if (insertError.code === 11000) {
          failedInserts.push({
            error: "Duplicate Aadhar found during insertion",
            details: insertError.keyValue,
          });
        } else {
          throw insertError;
        }
      }
    } else {
      await session.abortTransaction();
    }

    session.endSession();

    // 10. Prepare response
    const response = {
      success: true,
      message: "Bulk import completed",
      summary: {
        totalRowsProcessed: totalRows - 1,
        successfullyInserted: insertedCount,
        skippedRows: skippedRows.length,
        failedRows: errors.length + failedInserts.length,
        successRate: `${((insertedCount / (totalRows - 1)) * 100).toFixed(1)}%`,
      },
    };

    // Add errors if any
    if (errors.length > 0 || failedInserts.length > 0) {
      response.errors = {
        rowErrors: errors.slice(0, 20), // Show first 20 errors
        insertErrors: failedInserts,
        totalErrors: errors.length + failedInserts.length,
      };

      if (errors.length > 20) {
        response.errors.note = `... and ${errors.length - 20} more row errors`;
      }
    }

    // Add sample of successful data
    if (studentsToInsert.length > 0 && insertedCount > 0) {
      response.sample = studentsToInsert.slice(0, 3); // Show first 3 successful records
    }

    return res.status(200).json(response);
  } catch (error) {
    // Cleanup on error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("Bulk import error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error during bulk import",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      errorCode: "SERVER_ERROR",
    });
  }
};

/**
 * Download Excel template for bulk import
 */
export const downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students Template");

    // Add headers with sample data
    const headers = [
      { header: "student_name", key: "studentName", width: 20 },
      { header: "father_name", key: "fatherName", width: 20 },
      { header: "mother_name", key: "motherName", width: 20, note: "Optional" },
      {
        header: "dob",
        key: "dob",
        width: 15,
        note: "Format: DD/MM/YYYY or YYYY-MM-DD",
      },
      { header: "gender", key: "gender", width: 10, note: "Male/Female/Other" },
      {
        header: "aadhar_no",
        key: "aadharNo",
        width: 15,
        note: "12 digits, required",
      },
      {
        header: "mobile",
        key: "mobile",
        width: 15,
        note: "10 digits, optional",
      },
      { header: "email", key: "email", width: 25, note: "Optional" },
      { header: "address", key: "address", width: 30, note: "Optional" },
      { header: "city", key: "city", width: 15, note: "Optional" },
      { header: "state", key: "state", width: 15, note: "Optional" },
      { header: "pincode", key: "pincode", width: 10, note: "Optional" },
      {
        header: "admission_date",
        key: "admissionDate",
        width: 15,
        note: "Optional",
      },
      { header: "session", key: "session", width: 15, note: "e.g., 2024-25" },
      {
        header: "class_name",
        key: "className",
        width: 15,
        note: "e.g., 10th, 11th",
      },
      { header: "section", key: "section", width: 10, note: "Optional" },
      { header: "roll_no", key: "rollNo", width: 10, note: "Optional" },
    ];

    worksheet.columns = headers;

    // Add sample data row
    worksheet.addRow({
      studentName: "John Doe",
      fatherName: "Robert Doe",
      motherName: "Mary Doe",
      dob: "15/05/2005",
      gender: "Male",
      aadharNo: "123456789012",
      mobile: "9876543210",
      email: "john@example.com",
      address: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      admissionDate: "01/04/2024",
      session: "2024-25",
      className: "10th",
      section: "A",
      rollNo: "15",
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };

    // Add instructions
    worksheet.addRow([]);
    const instructionRow = worksheet.addRow(["Instructions:"]);
    instructionRow.font = { bold: true, color: { argb: "FFC00000" } };

    worksheet.addRow(["1. Fill data starting from row 2"]);
    worksheet.addRow(["2. Do not modify column headers"]);
    worksheet.addRow([
      "3. Required fields: student_name, father_name, dob, gender, aadhar_no, session, class_name",
    ]);
    worksheet.addRow(["4. Delete sample row before uploading"]);
    worksheet.addRow(["5. Save file as .xlsx or .csv"]);

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=student_bulk_template.xlsx"
    );

    // Send file
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Template download error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate template",
    });
  }
};
