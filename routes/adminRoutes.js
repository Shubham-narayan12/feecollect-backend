import express from "express";
import {
  createAdmin,
  editAdmin,
  deleteAdmin,
  loginAdmin,
  logoutAdmin,
  getMe,
} from "../controller/adminController.js";

const router = express.Router();

router.post("/create", createAdmin);
router.post("/login", loginAdmin);
router.get("/get-me", getMe);
router.put("/:id", editAdmin);
router.delete("/:id", deleteAdmin);
router.post("/logout", logoutAdmin);

export default router;
