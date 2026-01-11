import express from "express";
import {
  collectFee,
  createRecommendedFeeForIndivualStudent,
  deleteOneRecommendedFee,
  getLedgerByStudentId,
} from "../controller/FeeLedgerController.js";
import { receiptCollectFee } from "../controller/receiptController.js";

const router = express.Router();

//COLLECT FEE
router.post("/collect-fee", collectFee);



//GET FEE DEATILS OF SINGLE STUDENT
router.get("/:id", getLedgerByStudentId);

//ADD RECOMMENDED FEE FOR INDIVUAL STUDENT
router.post("/add-recommended-fee",createRecommendedFeeForIndivualStudent)

//DELET ONE BY ONE RECOMMENDED 
router.delete("/delete-recommendedfee/:studentId/:recommendedFeeId",deleteOneRecommendedFee)

export default router;
