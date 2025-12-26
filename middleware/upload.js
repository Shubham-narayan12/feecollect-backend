// middlewares/upload.js
import multer from "multer";

const storage = multer.diskStorage({
  destination: "uploads/temp",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const uploadStudentPhotos = multer({ storage }).fields([
  { name: "photo", maxCount: 1 },
  { name: "fatherPhoto", maxCount: 1 },
  { name: "motherPhoto", maxCount: 1 },
]);
