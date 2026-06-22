import express from "express";
import {
  downloadReceipt,
  downloadReceiptAnytime,
  getReceiptById,
  receiptCollectFee,
  searchReceipts,
} from "../controller/receiptController.js";

const router = express.Router();

//RECEIPT COLLECT FEE
router.post("/recipt-collect-fee", receiptCollectFee);

//SERACH RECIPT
router.post("/search-recipt", searchReceipts);

//SEARCH RECIPT BY ID
router.get("/:id", getReceiptById);

//DOWNLOAD RECEIPT
router.get("/download/:fileName", downloadReceipt);

//DOWNLOAD RECIPT ANYTIME
router.get("/download-anytime/:id", downloadReceiptAnytime);

export default router;
