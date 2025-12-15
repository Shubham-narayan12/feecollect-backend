import express from "express";
import {
  collectFee,
  getLedgerByStudentId,
} from "../controller/FeeLedgerController.js";
import { receiptCollectFee } from "../controller/receiptController.js";

const router = express.Router();

//COLLECT FEE
router.post("/collect-fee", collectFee);

//RECEIPT COLLECT FEE
router.post("/recipt-collect-fee", receiptCollectFee);

//GET FEE DEATILS OF SINGLE STUDENT
router.get("/:id", getLedgerByStudentId);

export default router;
