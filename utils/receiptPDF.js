import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateReceiptPDF = async (receipt) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `${receipt.receiptNo}.pdf`;

      const receiptsDir = process.env.VERCEL
        ? "/tmp/receipts"
        : path.join("uploads", "receipts");

      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const pdfPath = path.join(receiptsDir, fileName);

      // ================= A5 SIZE =================

      const doc = new PDFDocument({
        size: "A5",
        margin: 30,
      });

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      /*
      ================= HEADER =================
      */

      doc.fontSize(15).text("GREEN FIELD SCHOOL", {
        align: "center",
      });

      doc
        .fontSize(8)
        .text("BEDUTOLA, POST OFFICE-THAWE, GOPALGANJ PIN-841440", {
          align: "center",
        });

      doc.moveDown(0.5);

      doc.moveTo(30, doc.y).lineTo(390, doc.y).stroke();

      doc.moveDown(0.7);

      /*
      ================= RECEIPT INFO =================
      */

      doc.fontSize(9);

      doc.text(`Receipt No : ${receipt.receiptNo}`, 30, doc.y);

      doc.text(`Date : ${new Date().toLocaleDateString()}`, 280, doc.y - 11);

      doc.moveDown(1);

      /*
      ================= STUDENT INFO LEFT =================
      */

      doc.fontSize(9);

      let infoY = doc.y + 8;

      const studentInfo = [
        ["Student Name", receipt.studentName],
        ["Father Name", receipt.fatherName],
        ["Class / Section", `${receipt.className} - ${receipt.section}`],
        ["Roll No", receipt.rollNo],
      ];

      studentInfo.forEach((item) => {
        doc.text(`${item[0]} :`, 30, infoY);

        doc.text(item[1] || "", 130, infoY);

        infoY += 14;
      });

      doc.moveTo(30, infoY).lineTo(390, infoY).stroke();

      /*
      ================= TABLE =================
      */

      let y = infoY + 15;

      doc.fontSize(9);

      doc.text("SL", 35, y);
      doc.text("DESCRIPTION", 70, y);
      doc.text("AMOUNT", 310, y);

      y += 12;

      doc.moveTo(30, y).lineTo(390, y).stroke();

      y += 8;

      let sl = 1;

      const monthsText =
        receipt.months && receipt.months.length
          ? ` (${receipt.months.join(", ")})`
          : "";

      const addRow = (label, value) => {
        if (value > 0) {
          doc.text(sl++, 35, y);

          doc.text(label, 70, y, {
            width: 220,
          });

          doc.text(value.toFixed(2), 310, y);

          y += 14;
        }
      };

      addRow(`Tuition Fee${monthsText}`, receipt.tuitionFee);

      addRow(`Transport Fee${monthsText}`, receipt.transportFee);

      addRow("Admission Fee", receipt.admissionFee);

      addRow("Annual Fee", receipt.annualFee);

      receipt.extraFees?.forEach((f) => {
        addRow(f.title, f.amount);
      });

      doc.moveTo(30, y).lineTo(390, y).stroke();

      y += 12;

      /*
      ================= TOTAL =================
      */

      const totalRow = (title, value) => {
        doc.text(title, 220, y);

        doc.text(value.toFixed(2), 310, y);

        y += 14;
      };

      totalRow("Total Amount", receipt.totalAmount);

      totalRow("Paid Amount", receipt.paidAmount);

      totalRow("Due Amount", receipt.dueAmount);

      y += 10;

      doc.text(`Payment Mode : ${receipt.paymentMode}`, 30, y);

      y += 35;

      doc.text("Prepared By : Admin", 30, y);

      doc.text("Authorised Signatory", 250, y);

      doc.end();

      stream.on("finish", () => {
        resolve(fileName);
      });
    } catch (err) {
      reject(err);
    }
  });
};
