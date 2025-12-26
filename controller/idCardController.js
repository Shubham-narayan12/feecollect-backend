import fs from "fs";
import path from "path";
import Student from "../model/studentModel.js";
import puppeteer from "puppeteer";

const DEFAULT_FATHER = "https://your-default-image/father.png";
const DEFAULT_MOTHER = "https://your-default-image/mother.png";

export const generateBulkIDCards = async (req, res) => {
  try {
    const { startSerial, endSerial } = req.body;

    // ✅ STEP 0: Validation FIRST
    if (!startSerial || !endSerial) {
      return res.status(400).json({
        message: "startSerial and endSerial are required",
      });
    }

    // ✅ STEP 1: Ensure folder exists
    const outputDir = path.join("public", "idcards");
    fs.mkdirSync(outputDir, { recursive: true });

    // ✅ STEP 2: PDF file name & path
    const fileName = `idcards-${startSerial}-${endSerial}.pdf`;
    const pdfPath = path.join(outputDir, fileName);

    // ✅ STEP 3: Fetch students
    const students = await Student.find({
      serialNo: { $gte: startSerial, $lte: endSerial },
    }).sort({ serialNo: 1 });

    if (!students.length) {
      return res.status(404).json({
        message: "No students found in this serial range",
      });
    }

    const warnings = [];
    let html = "";

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    for (const student of students) {
      const fatherPhoto =
        student.fatherPhoto && student.fatherPhoto !== "N/A"
          ? student.fatherPhoto
          : DEFAULT_FATHER;

      const motherPhoto =
        student.motherPhoto && student.motherPhoto !== "N/A"
          ? student.motherPhoto
          : DEFAULT_MOTHER;

      if (student.fatherPhoto === "N/A" || student.motherPhoto === "N/A") {
        warnings.push(
          `Parent photo missing for Serial No: ${student.serialNo}`
        );
      }

      html += `
        <div class="card">
          <div class="front">
            <img src="${student.photo}" class="student"/>
            <h3>${student.studentName}</h3>
            <p>${student.className}-${student.section || ""}</p>
            <p>ID: ${student.serialNo}</p>
          </div>

          <div class="back">
            <div class="parents">
              <img src="${fatherPhoto}" class="parent"/>
              <img src="${motherPhoto}" class="parent"/>
            </div>
            <p>${student.address1 || ""}</p>
          </div>
        </div>
      `;
    }

    await page.setContent(`
      <html>
        <style>
          body { margin: 0; padding: 0; }
          .card {
            width: 350px;
            height: 220px;
            page-break-after: always;
            border: 1px solid #ccc;
            padding: 10px;
          }
          .student {
            width: 120px;
            height: 140px;
            object-fit: cover;
          }
          .parents {
            display: flex;
            gap: 10px;
          }
          .parent {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
          }
        </style>
        <body>${html}</body>
      </html>
    `);

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // ✅ STEP 4: Response with DOWNLOAD URL
    res.json({
      success: true,
      message: "Bulk ID cards generated successfully",
      range: `${startSerial} - ${endSerial}`,
      total: students.length,
      downloadUrl: `/api/v1/idcard/download/${fileName}`,
      warnings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DOWNLOAD ID CARD IN PDF
export const downloadIDCardPDF = async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: "File name is required",
      });
    }

    const filePath = path.join(process.cwd(), "public", "idcards", fileName);

    // 🔍 Check file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "ID Card PDF not found",
      });
    }

    // ⬇️ Download + delete after success
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Download error:", err);
        return;
      }

      // 🗑️ Delete file after download
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("File delete error:", unlinkErr);
        } else {
          console.log(`ID Card deleted: ${fileName}`);
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

