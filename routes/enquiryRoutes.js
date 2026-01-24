import express from "express";
import {
  createEnquiryController,
  deleteAllEnquiryController,
  deleteSingleEnquiryController,
  getAllEnquiryController,
  getSingleEnquiryController,
  totalNumberOfEnquiry,
} from "../controller/enquiryController.js";

//routes objects
const router = express.Router();

//==============ENQUIRY ROUTES===============

//CREATE ROUTES
router.post("/create", createEnquiryController);

//GET ALL ENRUIRY
router.get("/get-all", getAllEnquiryController);

//TOTAL NUMBER OF ENQUIRY
router.get("/total-enquiries", totalNumberOfEnquiry);

//GET SINGLE ENQUIRY
router.get("/:id", getSingleEnquiryController);

//DELETE SINGLE ENQUIRY
router.delete("/:id", deleteSingleEnquiryController);

//DELETE ALL ENQUIRY
router.delete("/all-enquiry", deleteAllEnquiryController);

export default router;
