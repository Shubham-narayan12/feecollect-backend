import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import cloudinary from "../config/cloudinary.js";
import studentModel from "../model/studentModel.js";

export const uploadParentPhotoZip = async (req, res) => {
  try {
    const batch = req.body.batch || "batch-2025-01";

    if (!req.file) {
      return res.status(400).json({ message: "ZIP file required" });
    }

    const zipPath = req.file.path;
    const extractPath = `uploads/${batch}`;

    fs.mkdirSync(extractPath, { recursive: true });

    const updated = [];
    const warnings = [];

    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .on("finish", async () => {
        const files = fs.readdirSync(extractPath);

        for (const file of files) {
          const filePath = path.join(extractPath, file);

          // only images
          if (!file.match(/\.(jpg|jpeg|png)$/i)) continue;

          // s1.jpg / f1.jpg / m1.jpg
          const match = file.match(/^([sfm])(\d+)\./i);
          if (!match) {
            warnings.push(`Invalid file name: ${file}`);
            continue;
          }

          const type = match[1].toLowerCase(); // s | f | m
          const serialNo = Number(match[2]);

          const student = await studentModel.findOne({ serialNo });
          if (!student) {
            warnings.push(`Student not found for serialNo: ${serialNo}`);
            continue;
          }

          // upload to cloudinary
          const uploadRes = await cloudinary.uploader.upload(filePath, {
            folder: `student-parents-photos/${batch}`,
            public_id: file.replace(path.extname(file), ""),
            overwrite: true,
          });

          // save according to type
          if (type === "f") {
            student.fatherPhoto = uploadRes.secure_url;
          } else if (type === "m") {
            student.motherPhoto = uploadRes.secure_url;
          } else if (type === "s") {
            student.photo = uploadRes.secure_url; // 👈 STUDENT PHOTO
          }

          await student.save();

          updated.push({
            serialNo,
            type:
              type === "f"
                ? "Father"
                : type === "m"
                ? "Mother"
                : "Student",
            url: uploadRes.secure_url,
          });
        }

        res.json({
          success: true,
          message:
            "Student + Parent photos uploaded & records updated successfully",
          updatedCount: updated.length,
          updated,
          warnings,
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
