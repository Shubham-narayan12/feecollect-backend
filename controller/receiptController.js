import Receipt from "../model/ReceiptModel.js";
import path from "path";
import fs from "fs";
import { generateNextReceiptNo } from "../utils/generateReceiptCounter.js";
import { generateReceiptPDF } from "../utils/receiptPDF.js";

export const receiptCollectFee = async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      className,
      section,
      tuitionFee,
      admissionFee,
      annualFee,
      examFee,
      transportFee,
      extraFees,
      discount,
      scholarship,
      paidAmount,
      paymentMode,
      month,
    } = req.body;

    const year = new Date().getFullYear();

    // 1. Generate receipt number
    const receiptNo = await generateNextReceiptNo();

    // 2. Calculate totals
    const totalAmount =
      tuitionFee +
      admissionFee +
      annualFee +
      examFee +
      transportFee +
      (extraFees?.reduce((sum, f) => sum + f.amount, 0) || 0) -
      discount -
      scholarship;

    const dueAmount = totalAmount - paidAmount;

    // 3. Save to DB
    const newReceipt = await Receipt.create({
      receiptNo,
      studentId,
      studentName,
      className,
      section,
      tuitionFee,
      admissionFee,
      annualFee,
      examFee,
      transportFee,
      extraFees,
      discount,
      scholarship,
      totalAmount,
      paidAmount,
      dueAmount,
      paymentMode,
      month,
      year,
    });

    // 4. Generate PDF
    const pdfUrl = await generateReceiptPDF(newReceipt);

    // 5. Update pdf url in DB
    newReceipt.pdfUrl = pdfUrl;
    await newReceipt.save();

    res.json({
      success: true,
      message: "Fee collected & PDF generated",
      receipt: newReceipt,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
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

