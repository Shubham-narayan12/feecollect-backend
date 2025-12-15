import express from "express";
import { downloadReceipt } from "../controller/receiptController.js";

const router = express.Router();

router.get("/download/:fileName", downloadReceipt);

export default router;
