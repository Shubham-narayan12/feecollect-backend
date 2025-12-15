import express from "express";
import { createFeeStructure, deleteFeeStructure, getAllFeeStructures, getFeeStructureByClass, updateFeeStructure } from "../controller/feeStructureController.js";


const router = express.Router();

//CREATE FEE
router.post("/create",createFeeStructure);

//GET FEE STRUCTURE BY CLASS
router.post("/get-fee-by-class",getFeeStructureByClass);

//GET ALL FEE STRUCTURE
router.get("/get-all-feestructure",getAllFeeStructures);

//EDIT FEE STRUCTURE
router.put("/:id",updateFeeStructure);

//DELETE FEE STRUCTURE
router.delete("/:id",deleteFeeStructure);

export default router;