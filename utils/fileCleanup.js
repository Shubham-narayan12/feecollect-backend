import fs from "fs";
import path from "path";

/**
 * Clean up temporary files after upload to Cloudinary
 * @param {string} filePath - Path to the file to delete
 */
export const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Cleaned up temp file: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning up file ${filePath}:`, error.message);
  }
};

/**
 * Clean up multiple temporary files
 * @param {string[]} filePaths - Array of file paths to delete
 */
export const cleanupTempFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    cleanupTempFile(filePath);
  });
};

/**
 * Clean up temporary files from request
 * @param {Object} req - Express request object with files
 */
export const cleanupRequestFiles = (req) => {
  try {
    // Single file
    if (req.file) {
      cleanupTempFile(req.file.path);
    }

    // Multiple files (multer fields)
    if (req.files) {
      if (Array.isArray(req.files)) {
        // Array of files
        req.files.forEach((file) => cleanupTempFile(file.path));
      } else {
        // Object with field names
        Object.values(req.files).forEach((filesArray) => {
          filesArray.forEach((file) => cleanupTempFile(file.path));
        });
      }
    }
  } catch (error) {
    console.error("❌ Error cleaning up request files:", error.message);
  }
};
