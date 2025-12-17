import express from "express";
import {
  createAdmin,
  editAdmin,
  deleteAdmin,
  loginAdmin,
  logoutAdmin,
} from "../controller/adminController.js";

const router = express.Router();

router.post("/create", createAdmin);
router.post("/login", loginAdmin);
router.put("/:id", editAdmin);
router.delete("/:id", deleteAdmin);
router.post("/logout", logoutAdmin);

export default router;
