import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";


export const generateReceiptPDF = async (receipt) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `${receipt.receiptNo}.pdf`;
      const pdfPath = path.join("uploads", "receipts", fileName);

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      /* ================= HEADER ================= */
      doc
        .fontSize(18)
        .text("ABC PUBLIC SCHOOL", { align: "center" })
        .fontSize(10)
        .text("Address Line 1, City, State - PIN", { align: "center" })
        .moveDown(0.8);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      /* ================= RECEIPT INFO ================= */
      doc
        .fontSize(11)
        .text(`Receipt No : ${receipt.receiptNo}`, 50, doc.y, { continued: true })
        .text(
          `Date : ${new Date().toLocaleDateString()}`,
          { align: "right" }
        )
        .moveDown(1);

      /* ================= STUDENT INFO ================= */
      doc
        .fontSize(11)
        .text(`Student Name : ${receipt.studentName}`)
        .text(`Class / Section : ${receipt.className} - ${receipt.section}`)
        .text(`Month : ${receipt.month} ${receipt.year}`)
        .moveDown(1);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.8);

      /* ================= TABLE HEADER ================= */
      let y = doc.y;
      doc.fontSize(11).text("SL", 50, y);
      doc.text("DESCRIPTION", 100, y);
      doc.text("AMOUNT (₹)", 450, y, { align: "right" });

      y += 15;
      doc.moveTo(50, y).lineTo(545, y).stroke();

      /* ================= TABLE BODY ================= */
      let sl = 1;
      y += 8;

      const addRow = (label, value) => {
        if (value > 0) {
          doc.fontSize(11).text(sl++, 50, y);
          doc.text(label, 100, y);
          doc.text(value.toFixed(2), 450, y, { align: "right" });
          y += 18;
        }
      };

      addRow("Tuition Fee", receipt.tuitionFee);
      addRow("Admission Fee", receipt.admissionFee);
      addRow("Annual Fee", receipt.annualFee);
      addRow("Exam Fee", receipt.examFee);
      addRow("Transport Fee", receipt.transportFee);

      receipt.extraFees?.forEach((f) => {
        addRow(f.title, f.amount);
      });

      y += 5;
      doc.moveTo(50, y).lineTo(545, y).stroke();
      y += 12;

      /* ================= TOTALS ================= */
      const rightText = (label, value) => {
        doc.text(label, 300, y);
        doc.text(value.toFixed(2), 450, y, { align: "right" });
        y += 16;
      };

      rightText("Sub Total", receipt.totalAmount);
      rightText("Discount", -receipt.discount);
      rightText("Scholarship", -receipt.scholarship);

      y += 5;
      doc.moveTo(300, y).lineTo(545, y).stroke();
      y += 12;

      rightText("Paid Amount", receipt.paidAmount);
      rightText("Due Amount", receipt.dueAmount);

      y += 20;

      /* ================= FOOTER ================= */
      doc
        .fontSize(11)
        .text(`Payment Mode : ${receipt.paymentMode}`, 50, y)
        .moveDown(2);

      doc.text("Prepared By : Admin", 50, doc.y);
      doc.text("Authorised Signatory", 400, doc.y + 40);

      doc.end();

      stream.on("finish", () => {
        resolve(`/uploads/receipts/${fileName}`);
      });
    } catch (err) {
      reject(err);
    }
  });
};

