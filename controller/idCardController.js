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
        <div class="id-card">

  <!-- FRONT SIDE -->
  <div class="card front">
    <h2 class="school-name">GLOBAL PUBLIC SCHOOL</h2>
    <p class="tagline">Knowledge • Excellence • Integrity</p>

    <div class="photo-box">
      <img src="${student.photo}" alt="Student Photo" />
    </div>

    <h3 class="student-name">${student.studentName}</h3>
    <p class="class">
      Class ${student.className} - Section ${student.section || ""}
    </p>

    <div class="id-box">
      ID: ${student.serialNo}
    </div>
  </div>

  <!-- BACK SIDE -->
  <div class="card back">
    <h2 class="school-name">GLOBAL PUBLIC SCHOOL</h2>
    <p class="subtitle">Parent / Guardian Information</p>

    <div class="parents-box">
      <div class="parent">
        <img src="${fatherPhoto}" />
        <p>Father</p>
      </div>

      <div class="parent">
        <img src="${motherPhoto}" />
        <p>Mother</p>
      </div>
    </div>

    <div class="address">
      <strong>Address:</strong><br/>
      ${student.address1 || "N/A"}
    </div>
  </div>

</div>
      `;
    }

    await page.setContent(`
      <html>
        <style>
         body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

.id-card {
  page-break-after: always;
}

.card {
  width: 350px;
  height: 220px;
  border: 1px solid #000;
  padding: 10px;
  box-sizing: border-box;
  text-align: center;
}

/* COMMON */
.school-name {
  font-size: 16px;
  margin: 5px 0;
  font-weight: bold;
}

.tagline,
.subtitle {
  font-size: 11px;
  margin-bottom: 8px;
}

/* FRONT */
.photo-box {
  width: 110px;
  height: 130px;
  border: 1px solid #000;
  margin: 0 auto 8px;
}

.photo-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-name {
  font-size: 14px;
  margin: 5px 0;
}

.class {
  font-size: 12px;
}

.id-box {
  margin-top: 8px;
  font-size: 12px;
  border: 1px solid #000;
  display: inline-block;
  padding: 4px 10px;
}

/* BACK */
.parents-box {
  display: flex;
  justify-content: space-around;
  margin: 10px 0;
}

.parent img {
  width: 60px;
  height: 60px;
  border: 1px solid #000;
  object-fit: cover;
}

.parent p {
  font-size: 11px;
  margin-top: 4px;
}

.address {
  font-size: 11px;
  border-top: 1px solid #000;
  padding-top: 6px;
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
      fileName: fileName,
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

// GENERATE BULK ID CARDS BY CLASS & SECTION
export const generateBulkIDCardsByClassSection = async (req, res) => {
  try {
    const { className, section } = req.body;

    // ✅ STEP 0: Validation
    if (!className) {
      return res.status(400).json({
        success: false,
        message: "className is required",
      });
    }

    // ✅ STEP 1: Ensure folder exists
    const outputDir = path.join("public", "idcards");
    fs.mkdirSync(outputDir, { recursive: true });

    // ✅ STEP 2: File name
    const safeSection = section ? section : "ALL";
    const fileName = `idcards-${className}-${safeSection}.pdf`;
    const pdfPath = path.join(outputDir, fileName);

    // ✅ STEP 3: Build query
    const query = { className };
    if (section) query.section = section;

    // ✅ STEP 4: Fetch students
    const students = await Student.find(query).sort({ serialNo: 1 });

    if (!students.length) {
      return res.status(404).json({
        success: false,
        message: "No students found for this class/section",
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
       <div class="id-card">

  <!-- FRONT SIDE -->
  <div class="card front">
    <h2 class="school-name">GLOBAL PUBLIC SCHOOL</h2>
    <p class="tagline">Knowledge • Excellence • Integrity</p>

    <div class="photo-box">
      <img src="${student.photo}" alt="Student Photo" />
    </div>

    <h3 class="student-name">${student.studentName}</h3>
    <p class="class">
      Class ${student.className} - Section ${student.section || ""}
    </p>

    <div class="id-box">
      ID: ${student.serialNo}
    </div>
  </div>

  <!-- BACK SIDE -->
  <div class="card back">
    <h2 class="school-name">GLOBAL PUBLIC SCHOOL</h2>
    <p class="subtitle">Parent / Guardian Information</p>

    <div class="parents-box">
      <div class="parent">
        <img src="${fatherPhoto}" />
        <p>Father</p>
      </div>

      <div class="parent">
        <img src="${motherPhoto}" />
        <p>Mother</p>
      </div>
    </div>

    <div class="address">
      <strong>Address:</strong><br/>
      ${student.address1 || "N/A"}
    </div>
  </div>

</div>

      `;
    }

    await page.setContent(`
      <html>
        <style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

.id-card {
  page-break-after: always;
}

.card {
  width: 350px;
  height: 220px;
  border: 1px solid #000;
  padding: 10px;
  box-sizing: border-box;
  text-align: center;
}

/* COMMON */
.school-name {
  font-size: 16px;
  margin: 5px 0;
  font-weight: bold;
}

.tagline,
.subtitle {
  font-size: 11px;
  margin-bottom: 8px;
}

/* FRONT */
.photo-box {
  width: 110px;
  height: 130px;
  border: 1px solid #000;
  margin: 0 auto 8px;
}

.photo-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-name {
  font-size: 14px;
  margin: 5px 0;
}

.class {
  font-size: 12px;
}

.id-box {
  margin-top: 8px;
  font-size: 12px;
  border: 1px solid #000;
  display: inline-block;
  padding: 4px 10px;
}

/* BACK */
.parents-box {
  display: flex;
  justify-content: space-around;
  margin: 10px 0;
}

.parent img {
  width: 60px;
  height: 60px;
  border: 1px solid #000;
  object-fit: cover;
}

.parent p {
  font-size: 11px;
  margin-top: 4px;
}

.address {
  font-size: 11px;
  border-top: 1px solid #000;
  padding-top: 6px;
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

    // ✅ STEP 5: Response
    res.json({
      success: true,
      message: "Bulk ID cards generated successfully (Class/Section)",
      className,
      section: section || "ALL",
      total: students.length,
      fileName,
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
