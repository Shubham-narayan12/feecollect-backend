import Receipt from "../model/ReceiptModel.js";
import Student from "../model/studentModel.js";
import path from "path";
import fs from "fs";
import { generateNextReceiptNo } from "../utils/generateReceiptCounter.js";
import { generateReceiptPDF } from "../utils/receiptPDF.js";

export const receiptCollectFee = async (req, res) => {
  try {
    const {
      studentId,
      monthlyRecords,
      admissionFee,
      annualFee,
      extraFees,
      paidAmount,
      paymentMode,
    } = req.body;

    const year = new Date().getFullYear();

    // 1️⃣ Get Student Details using studentId
    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const studentName = student.studentName;
    const fatherName = student.fatherName;
    const className = student.className;
    const section = student.section;
    const rollNo = student.rollNo;

    // 2️⃣ Generate Receipt Number
    const receiptNo = await generateNextReceiptNo();

    let tuitionFee = 0;
    let transportFee = 0;
    let months = [];

    // 3️⃣ Monthly Records Calculation
    if (monthlyRecords && Array.isArray(monthlyRecords)) {
      monthlyRecords.forEach((m) => {
        tuitionFee += m.tuitionFee || 0;
        transportFee += m.transportFee || 0;
        months.push(`${m.month}`);
      });
    }

    // 4️⃣ Extra Fees Total
    const extraFeeTotal = extraFees?.reduce((sum, f) => sum + f.amount, 0) || 0;

    // 5️⃣ Total Amount Calculation
    const totalAmount =
      (admissionFee || 0) +
      (annualFee || 0) +
      tuitionFee +
      transportFee +
      extraFeeTotal;

    const dueAmount = Math.max(totalAmount - paidAmount, 0);

    // 6️⃣ Save Receipt in DB
    const newReceipt = await Receipt.create({
      receiptNo,
      studentId,
      studentName,
      fatherName,
      className,
      section,
      rollNo,

      admissionFee: admissionFee || 0,
      annualFee: annualFee || 0,
      tuitionFee,
      transportFee,
      extraFees,

      totalAmount,
      paidAmount,
      dueAmount,

      paymentMode,
      months,
      year,
    });

    // 7️⃣ Generate PDF
    const fileName = await generateReceiptPDF(newReceipt);

    // 8️⃣ Update PDF URL
    newReceipt.fileName = fileName;
    await newReceipt.save();

    return res.status(200).json({
      success: true,
      message: "Fee collected & receipt generated",
      receipt: newReceipt,
    });
  } catch (error) {
    console.error("Receipt Collect Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DOWNLOAD RECEIPT & AUTO DELETE
export const downloadReceipt = async (req, res) => {
  try {
    const { fileName } = req.params;

    const filePath = path.join("uploads", "receipts", fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    // Download + delete after send
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Download error:", err);
        return;
      }

      // 🧹 Delete file after successful download
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("File delete error:", unlinkErr);
        } else {
          console.log(`Temporary receipt deleted: ${fileName}`);
        }
      });
    });
  } catch (error) {
    console.error("Download Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while downloading receipt",
    });
  }
};
