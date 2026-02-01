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
      monthlyRecords = [],
      admissionFee = 0,
      annualFee = 0,
      extraFees = [],
      paidAmount = 0,
      paymentMode,
    } = req.body;

    const year = new Date().getFullYear();

    // 1️⃣ Student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const { studentName, fatherName, className, section, rollNo } = student;

    // 2️⃣ Receipt No
    const receiptNo = await generateNextReceiptNo();

    let tuitionFee = 0;
    let transportFee = 0;
    let months = [];

    // 3️⃣ Monthly Records
    if (Array.isArray(monthlyRecords)) {
      monthlyRecords.forEach((m) => {
        tuitionFee += Number(m.tuitionFee || 0);
        transportFee += Number(m.transportFee || 0);
        if (m.month) months.push(m.month);
      });
    }

    // 4️⃣ Extra Fees
    const extraFeeTotal = Array.isArray(extraFees)
      ? extraFees.reduce((sum, f) => sum + Number(f.amount || 0), 0)
      : 0;

    // 5️⃣ Total Amount (🔥 FIXED)
    const totalAmount =
      Number(admissionFee) +
      Number(annualFee) +
      tuitionFee +
      transportFee +
      extraFeeTotal;

    const paid = Number(paidAmount);
    const dueAmount = Math.max(totalAmount - paid, 0);

    // 6️⃣ Save Receipt
    const newReceipt = await Receipt.create({
      receiptNo,
      studentId,
      studentName,
      fatherName,
      className,
      section,
      rollNo,

      admissionFee: Number(admissionFee),
      annualFee: Number(annualFee),
      tuitionFee,
      transportFee,
      extraFees,

      totalAmount,
      paidAmount: paid,
      dueAmount,

      paymentMode,
      months,
      year,
    });

    // 7️⃣ Generate PDF
    const fileName = await generateReceiptPDF(newReceipt);

    // 8️⃣ Update file
    newReceipt.fileName = fileName;
    await newReceipt.save();

    return res.status(200).json({
      success: true,
      message: "Fee collected & receipt generated",
      receipt: newReceipt,
    });
  } catch (error) {
    console.error("Receipt Collect Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DOWNLOAD RECEIPT & AUTO DELETE
export const downloadReceipt = async (req, res) => {
  try {
    const { fileName } = req.params;

    // Use /tmp for Vercel serverless environment
    const filePath = process.env.VERCEL
      ? path.join("/tmp", "receipts", fileName)
      : path.join("uploads", "receipts", fileName);

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
