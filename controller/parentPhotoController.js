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
    const extractPath = process.env.VERCEL
      ? `/tmp/${batch}`
      : `uploads/${batch}`;

    // ✅ Folder Create
    fs.mkdirSync(extractPath, { recursive: true });

    const updated = [];
    const warnings = [];

    // ✅ Unzip processing
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .on("close", async () => {
        // "finish" ki jagah "close" zyada reliable hai yahan
        try {
          const files = fs.readdirSync(extractPath);

          for (const file of files) {
            const filePath = path.join(extractPath, file);

            if (!file.match(/\.(jpg|jpeg|png)$/i)) continue;

            const match = file.match(/^([sfm])(\d+)\./i);
            if (!match) {
              warnings.push(`Invalid file name: ${file}`);
              continue;
            }

            const type = match[1].toLowerCase();
            const serialNo = Number(match[2]);

            const student = await studentModel.findOne({ serialNo });
            if (!student) {
              warnings.push(`Student not found for serialNo: ${serialNo}`);
              continue;
            }

            // Upload to Cloudinary
            const uploadRes = await cloudinary.uploader.upload(filePath, {
              folder: `student-parents-photos/${batch}`,
              public_id: file.replace(path.extname(file), ""),
              overwrite: true,
            });

            if (type === "f") student.fatherPhoto = uploadRes.secure_url;
            else if (type === "m") student.motherPhoto = uploadRes.secure_url;
            else if (type === "s") student.photo = uploadRes.secure_url;

            await student.save();
            updated.push({ serialNo, type, url: uploadRes.secure_url });
          }

          // 🔥 Cleanup Logic Start 🔥

          // 1. Delete extracted files & folder
          if (fs.existsSync(extractPath)) {
            fs.rmSync(extractPath, { recursive: true, force: true });
          }

          // 2. Delete the original uploaded ZIP file
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
          }

          // 🔥 Cleanup Logic End 🔥

          return res.json({
            success: true,
            message: "Upload done and local storage cleaned!",
            updatedCount: updated.length,
            updated,
            warnings,
          });
        } catch (innerError) {
          console.error("Processing Error:", innerError);
          res.status(500).json({ success: false, message: innerError.message });
        }
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
