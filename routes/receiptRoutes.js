import express from "express";
import { downloadReceipt, receiptCollectFee } from "../controller/receiptController.js";

const router = express.Router();

//RECEIPT COLLECT FEE
router.post("/recipt-collect-fee", receiptCollectFee);

//DOWNLOAD RECEIPT
router.get("/download/:fileName", downloadReceipt);

export default router;
