import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateReceiptPDF = async (receipt) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `${receipt.receiptNo}.pdf`;
      const pdfPath = path.join("uploads", "receipts", fileName);

      const doc = new PDFDocument({ margin: 50 });

      // Save file
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // HEADER
      doc
        .fontSize(18)
        .text("ABC Public School", { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(12)
        .text(`Receipt No: ${receipt.receiptNo}`)
        .text(`Date: ${new Date().toLocaleDateString()}`)
        .moveDown();

      // Student Info
      doc
        .fontSize(13)
        .text(`Student: ${receipt.studentName}`)
        .text(`Class: ${receipt.className}  Section: ${receipt.section}`)
        .moveDown();

      // Fee Breakdown
      doc.fontSize(14).text("Fee Breakdown:", { underline: true }).moveDown(0.5);

      const feeList = [
        { label: "Tuition Fee", value: receipt.tuitionFee },
        { label: "Admission Fee", value: receipt.admissionFee },
        { label: "Annual Fee", value: receipt.annualFee },
        { label: "Exam Fee", value: receipt.examFee },
        { label: "Transport Fee", value: receipt.transportFee },
      ];

      feeList.forEach((f) => {
        if (f.value > 0) {
          doc.fontSize(12).text(`${f.label}: ₹${f.value}`);
        }
      });

      // Extra Fees
      receipt.extraFees?.forEach((e) => {
        doc.text(`${e.title}: ₹${e.amount}`);
      });

      doc.moveDown();

      doc
        .fontSize(13)
        .text(`Discount: ₹${receipt.discount}`)
        .text(`Scholarship: ₹${receipt.scholarship}`)
        .moveDown();

      // Total
      doc
        .fontSize(14)
        .text(`Total Amount: ₹${receipt.totalAmount}`)
        .text(`Paid Amount: ₹${receipt.paidAmount}`)
        .text(`Due Amount: ₹${receipt.dueAmount}`)
        .moveDown();

      doc.text(`Payment Mode: ${receipt.paymentMode}`).moveDown(2);

      // Footer
      doc
        .fontSize(12)
        .text("Thank you!", { align: "center" });

      doc.end();

      // Return URL when saved
      stream.on("finish", () => {
        resolve(`/uploads/receipts/${fileName}`);
      });

    } catch (err) {
      reject(err);
    }
  });
};
