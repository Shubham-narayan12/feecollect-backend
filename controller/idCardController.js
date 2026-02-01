import fs from "fs";
import path from "path";
import Student from "../model/studentModel.js";
import puppeteer from "puppeteer";

const DEFAULT_FATHER = "https://your-default-image/father.png";
const DEFAULT_MOTHER = "https://your-default-image/mother.png";
const SCHOOL_LOGO =
  "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=328,h=259,fit=crop/dOqNXeekPrHE45km/tcs-logo-123-d95rjaVGMBUEGBLg.png";

export const generateBulkIDCards = async (req, res) => {
  try {
    const { startSerial, endSerial } = req.body;

    // ✅ STEP 0: Validation
    if (!startSerial || !endSerial) {
      return res.status(400).json({
        success: false,
        message: "startSerial and endSerial are required",
      });
    }

    // ✅ STEP 1: Ensure output directory
    const outputDir = process.env.VERCEL
      ? path.join("/tmp", "idcards")
      : path.join("public", "idcards");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // ✅ STEP 2: PDF file
    const fileName = `idcards-${startSerial}-${endSerial}.pdf`;
    const pdfPath = path.join(outputDir, fileName);

    // ✅ STEP 3: Fetch students
    const students = await Student.find({
      serialNo: { $gte: startSerial, $lte: endSerial },
    }).sort({ serialNo: 1 });

    if (!students.length) {
      return res.status(404).json({
        success: false,
        message: "No students found in this serial range",
      });
    }

    let html = "";
    const warnings = [];

    // ✅ STEP 4: Build HTML
    for (const student of students) {
      if (!student.photo) {
        warnings.push(
          `Student photo missing for Serial No: ${student.serialNo}`,
        );
      }

      html += `
      <div class="id-card">
        <div class="card">

          <!-- HEADER -->
          <div class="header">
            <img class="logo" src="${SCHOOL_LOGO}" />
            <div class="school-text">
              <h2>Thawe Central School</h2>
              <p>
                BEDUTOLA, POST OFFICE-THAWE, GOPALGANJ<br/>
                Phone: 9471404548 
              </p>
            </div>
          </div>

          <!-- PHOTO -->
          <div class="photo-box">
               <img src="${student.photo}" />
               <div class="session">
                Session ${student.session}
          </div>
        </div>

          <!-- NAME -->
          <h3 class="student-name">${student.studentName}</h3>

          <!-- DETAILS -->
          <div class="details">
            <div><span>Admission No</span><span>${student.serialNo}</span></div>
            <div><span>Roll No</span><span>${student.rollNo || "N/A"}</span></div>
            <div><span>Class</span><span>${student.className} - ${student.section || ""} (2025-26)</span></div>
            <div><span>Father</span><span>${student.fatherName}</span></div>
            <div><span>Address</span><span>${student.address1 || "N/A"}</span></div>
            <div><span>Phone</span><span>${student.mobile || "N/A"}</span></div>
            <div><span>D.O.B</span><span>${student.dob}</span></div>
            <div><span>Blood</span><span>${student.bloodGroup || "N/A"}</span></div>
          </div>

          

        </div>
      </div>
      `;
    }

    // ✅ STEP 5: Puppeteer
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.setContent(`
<html>
<head>
<style>
  body {
    margin: 0;
    padding: 6mm;
    font-family: Arial, sans-serif;
  }

  /* A4 : 4 x 2 GRID */
  .page {
  display: grid;
  grid-template-columns: repeat(2, 85.6mm);
  grid-template-rows: repeat(4, 54mm);
  gap: 6mm;
  justify-content: center;
  page-break-after: always;
}

  /* CARD SIZE */
  .card {
    width: 85.6mm;
    height: 54mm;
    border: 1px solid #000;
    box-sizing: border-box;
    overflow: hidden;
  }

  /* ===== HEADER (IMAGE 1 STYLE) ===== */
  .header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #000;
    padding: 1.5mm;
  }

  .logo {
    width: 12mm;
    height: 12mm;
  }

  .school-text {
    flex: 1;
    text-align: center;
    font-size: 6pt;
  }

  .school-text h2 {
    margin: 0;
    font-size: 8pt;
    font-weight: bold;
  }

  .school-text p {
    margin: 0;
    font-size: 5.5pt;
  }
  .session {
  font-size: 5pt;
  font-weight: bold;
  margin-top: 0.5mm;
  }

  /* TITLE BAR */
  .title-bar {
    background: #777;
    color: #fff;
    text-align: center;
    font-size: 6pt;
    font-weight: bold;
    padding: 1mm 0;
  }

  /* ===== CONTENT (IMAGE 2 STYLE) ===== */
  .content {
    display: flex;
    padding: 2mm;
  }

  .photo-box {
  width: 18mm;
  height: auto;
  border: 1px solid #000;
  margin-right: 2mm;
  text-align: center;
}

  .photo-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .details {
    font-size: 5.8pt;
    line-height: 1.4;
    flex: 1;
  }

  .details div {
    display: flex;
  }

  .details span:first-child {
    width: 40%;
    font-weight: bold;
  }

  .details span:last-child {
    width: 60%;
  }

  /* BARCODE */
  .barcode {
    text-align: center;
    margin-top: 1mm;
  }

  .barcode img {
    width: 30mm;
    height: 7mm;
  }

  .barcode p {
    margin: 0;
    font-size: 5pt;
  }
</style>
</head>

<body>
${(() => {
  let pages = "";
  for (let i = 0; i < students.length; i += 8) {
    pages += `<div class="page">`;

    students.slice(i, i + 8).forEach((student) => {
      pages += `
      <div class="card">

        <!-- HEADER -->
        <div class="header">
          <img class="logo" src="${SCHOOL_LOGO}" />
          <div class="school-text">
            <h2>Thawe Central School</h2>
            <p>POST OFFICE - THAWE, DIST - GOPALGANJ<br/>Ph: 9471404548</p>
          </div>
        </div>

        <!-- TITLE -->
        <div class="title-bar">STUDENT IDENTITY CARD</div>

        <!-- CONTENT -->
        <div class="content">
          <div class="photo-box">
            <img src="${student.photo}" />
          </div>

          <div class="details">
            <div><span>Name</span><span>${student.studentName}</span></div>
            <div><span>Session</span><span>${student.session}</span></div>
            <div><span>Class/Section</span><span>${student.className}-${student.section || ""}</span></div>
            <div><span>Roll</span><span>${student.rollNo || "N/A"}</span></div>
            <div><span>Father</span><span>${student.fatherName}</span></div>
            <div><span>Phone</span><span>${student.mobile || "N/A"}</span></div>
            <div><span>DOB</span><span>${student.dob}</span></div>
            <div><span>Add</span><span>${student.address1 || "N/A"}</span></div>
            <div><span></span><span>${student.address2 || "N/A"}</span></div>
          </div>
        </div>

        

      </div>`;
    });

    pages += `</div>`;
  }
  return pages;
})()}
</body>
</html>
`);

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "5mm",
        bottom: "5mm",
        left: "5mm",
        right: "5mm",
      },
    });

    await browser.close();

    // ✅ STEP 6: Response
    res.json({
      success: true,
      message: "Bulk ID cards generated successfully",
      range: `${startSerial} - ${endSerial}`,
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

    // ✅ STEP 1: Ensure output directory
    const outputDir = process.env.VERCEL
      ? path.join("/tmp", "idcards")
      : path.join("public", "idcards");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // ✅ STEP 2: File name
    const safeSection = section || "ALL";
    const fileName = `idcards-${className}-${safeSection}.pdf`;
    const pdfPath = path.join(outputDir, fileName);

    // ✅ STEP 3: Query
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

    // ✅ STEP 5: BUILD HTML (IMPORTANT FIX)
    let pagesHTML = "";

    for (let i = 0; i < students.length; i += 8) {
      pagesHTML += `<div class="page">`;

      students.slice(i, i + 8).forEach((student) => {
        if (!student.photo) {
          warnings.push(`Photo missing for Serial No: ${student.serialNo}`);
        }

        pagesHTML += `
          <div class="card">
            <div class="header">
              <img class="logo" src="${SCHOOL_LOGO}" />
              <div class="school-text">
                <h2>Thawe Central School</h2>
              <p>
                BEDUTOLA, POST OFFICE-THAWE, GOPALGANJ<br/>
                Phone: 9471404548 
              </p>
              </div>
            </div>

            <div class="title-bar">STUDENT IDENTITY CARD</div>

            <div class="content">
              <div class="photo-box">
                <img src="${student.photo || ""}" />
              </div>

              <div class="details">
               <div><span>Name</span><span>${student.studentName}</span></div>
               <div><span>Session</span><span>${student.session}</span></div>
               <div><span>Class/Section</span><span>${student.className}-${student.section || ""}</span></div>
               <div><span>Roll</span><span>${student.rollNo || "N/A"}</span></div>
               <div><span>Father</span><span>${student.fatherName}</span></div>
               <div><span>Phone</span><span>${student.mobile || "N/A"}</span></div>
               <div><span>DOB</span><span>${student.dob}</span></div>
               <div><span>Add</span><span>${student.address1 || "N/A"}</span></div>
               <div><span></span><span>${student.address2 || "N/A"}</span></div>
              </div>
            </div>
          </div>
        `;
      });

      pagesHTML += `</div>`;
    }

    // ✅ STEP 6: Puppeteer
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.setContent(`
<!DOCTYPE html>
<html>
<head>
<style>
body {
  margin: 0;
  padding: 6mm;
  font-family: Arial, sans-serif;
}

/* A4 GRID : 4 x 2 */
.page {
  display: grid;
  grid-template-columns: repeat(2, 85.6mm);
  grid-template-rows: repeat(4, 54mm);
  gap: 6mm;
  justify-content: center;
  page-break-after: always;
}

/* CARD */
.card {
  width: 85.6mm;
  height: 54mm;
  border: 1px solid #000;
  box-sizing: border-box;
  overflow: hidden;
}

/* HEADER */
.header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #000;
  padding: 1.5mm;
}

.logo {
  width: 12mm;
  height: 12mm;
}

.school-text {
  flex: 1;
  text-align: center;
  font-size: 6pt;
}

.school-text h2 {
  margin: 0;
  font-size: 8pt;
}

.school-text p {
  margin: 0;
  font-size: 5.5pt;
}

/* TITLE */
.title-bar {
  background: #777;
  color: #fff;
  text-align: center;
  font-size: 6pt;
  font-weight: bold;
  padding: 1mm 0;
}

/* CONTENT */
.content {
  display: flex;
  padding: 2mm;
}

.photo-box {
  width: 18mm;
  height: 22mm;
  border: 1px solid #000;
  margin-right: 2mm;
}

.photo-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.details {
  font-size: 5.8pt;
  line-height: 1.4;
  flex: 1;
}

.details div {
  display: flex;
}

.details span:first-child {
  width: 40%;
  font-weight: bold;
}

.details span:last-child {
  width: 60%;
}
</style>
</head>

<body>
${pagesHTML}
</body>
</html>
`);

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "5mm",
        bottom: "5mm",
        left: "5mm",
        right: "5mm",
      },
    });

    await browser.close();

    // ✅ STEP 7: Response
    res.json({
      success: true,
      message: "Bulk ID cards generated successfully (Class/Section)",
      className,
      section: safeSection,
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

// ✅ GENERATE BULK ID CARD BACK SIDE (COUNT BASED)
export const generateBulkIDCardBackByCount = async (req, res) => {
  try {
    const { count } = req.body;

    // ✅ Validation
    if (!count || count <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid count is required",
      });
    }

    // ✅ Output directory
    const outputDir = process.env.VERCEL
      ? path.join("/tmp", "idcards")
      : path.join("public", "idcards");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `idcards-back-${count}.pdf`;
    const pdfPath = path.join(outputDir, fileName);

    // ✅ Guidelines
    const GUIDELINES = [
      "Always carry your school ID card during school hours.",
      "Your ID card is required for accessing school facilities.",
      "Notify the school immediately if your ID card is lost or damaged.",
      "Misuse of ID cards will result in disciplinary action.",
      "All students must comply with school ID card rules.",
      "ID card must be shown on demand by school authorities.",
      "This card is non-transferable and must be used only by the owner.",
      "Keep the card away from strong heat and magnetic fields.",
      "If found, please return this card to the school office.",
    ];

    // ✅ Address & Phone
    const SCHOOL_ADDRESS = `
      BEDUTOLA, POST OFFICE - THAWE, DIST - GOPALGANJ, PIN - 841440<br/>
      Ph: +91 - 9471404548, +91 - 7050154850
    `;

    // ✅ Build HTML (8 cards per page)
    let pagesHTML = "";

    for (let i = 0; i < count; i += 8) {
      pagesHTML += `<div class="page">`;

      for (let j = 0; j < 8 && i + j < count; j++) {
        pagesHTML += `
          <div class="card back-card">
            <div class="school-name">THAWE CENTRAL SCHOOL</div>

            <div class="back-title">GUIDELINES FOR ID CARD</div>

            <ul class="guidelines">
              ${GUIDELINES.map((g) => `<li>${g}</li>`).join("")}
            </ul>

            <div class="back-footer">
              ${SCHOOL_ADDRESS}
            </div>
          </div>
        `;
      }

      pagesHTML += `</div>`;
    }

    // ✅ Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setContent(`
<!DOCTYPE html>
<html>
<head>
<style>
body {
  margin: 0;
  padding: 6mm;
  font-family: Arial, sans-serif;
}

/* A4 GRID : 4 x 2 */
.page {
  display: grid;
  grid-template-columns: repeat(2, 85.6mm);
  grid-template-rows: repeat(4, 54mm);
  gap: 6mm;
  justify-content: center;
  page-break-after: always;
}

/* CARD */
.card {
  width: 85.6mm;
  height: 54mm;
  border: 1px solid #000;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* BACK DESIGN */
.back-card {
  padding: 2mm;
  font-size: 5.5pt;
}

.school-name {
  text-align: center;
  font-weight: bold;
  font-size: 7pt;
  margin-bottom: 1mm;
}

.back-title {
  background: #777; /* Updated Background to Grey */
  color: #fff;
  text-align: center;
  font-weight: bold;
  padding: 1mm;
  font-size: 6pt;
  margin-bottom: 1.5mm;
}

.guidelines {
  padding-left: 4mm;
  margin: 0;
  flex-grow: 1;
}

.guidelines li {
  margin-bottom: 0.8mm;
}

.back-footer {
  border-top: 1px solid #000;
  margin-top: 1mm;
  padding-top: 1mm;
  font-size: 5pt;
  text-align: center;
  font-weight: bold;
  line-height: 1.2;
}
</style>
</head>

<body>
${pagesHTML}
</body>
</html>
`);

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "5mm",
        bottom: "5mm",
        left: "5mm",
        right: "5mm",
      },
    });

    await browser.close();

    // ✅ Response
    res.json({
      success: true,
      message: "ID card BACK side generated successfully",
      totalBackCards: count,
      fileName,
      downloadUrl: `/api/v1/idcard/download/${fileName}`,
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
