import enquiryModel from "../model/enquiryModel.js";
import { fileURLToPath } from "url";
import path from "path";

// SET PATH
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CREATE ENQUIRY
export const createEnquiryController = async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    // Validate required fields
    if (!fullName || !email || !message) {
      return res.status(400).send({
        success: false,
        message: "Full name, email, and message are required.",
      });
    }

    const enquiry = await enquiryModel.create({
      fullName,
      email,
      phone,
      message,
    });

    res.status(201).send({
      success: true,
      message: "Enquiry created successfully.",
      enquiry,
    });
  } catch (error) {
    console.error("CREATE ENQUIRY ERROR:", error);
    res.status(500).send({
      success: false,
      message: error.message || "Error in CREATE ENQUIRY API",
    });
  }
};

// GET ALL ENQUIRIES
export const getAllEnquiryController = async (req, res) => {
  try {
    const enquiries = await enquiryModel.find({});
    res.status(200).send({
      success: true,
      message: "Fetched all enquiries.",
      enquiries,
    });
  } catch (error) {
    console.error("GET ALL ENQUIRIES ERROR:", error);
    res.status(500).send({
      success: false,
      message: "Error in GET ALL ENQUIRY API",
    });
  }
};

// GET SINGLE ENQUIRY
export const getSingleEnquiryController = async (req, res) => {
  try {
    const enquiry = await enquiryModel.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).send({
        success: false,
        message: "Enquiry not found.",
      });
    }

    res.status(200).send({
      success: true,
      message: "Enquiry found.",
      enquiry,
    });
  } catch (error) {
    console.error("GET SINGLE ENQUIRY ERROR:", error);
    res.status(500).send({
      success: false,
      message: "Error in GET SINGLE ENQUIRY API",
    });
  }
};

// DELETE SINGLE ENQUIRY
export const deleteSingleEnquiryController = async (req, res) => {
  try {
    const enquiry = await enquiryModel.findByIdAndDelete(req.params.id);

    if (!enquiry) {
      return res.status(404).send({
        success: false,
        message: "Enquiry not found.",
      });
    }

    res.status(200).send({
      success: true,
      message: "Enquiry deleted successfully.",
      enquiry,
    });
  } catch (error) {
    console.error("DELETE SINGLE ENQUIRY ERROR:", error);
    res.status(500).send({
      success: false,
      message: "Error in DELETE SINGLE ENQUIRY API",
    });
  }
};

// DELETE ALL ENQUIRIES
export const deleteAllEnquiryController = async (req, res) => {
  try {
    await enquiryModel.deleteMany({});
    res.status(200).send({
      success: true,
      message: "All enquiries deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE ALL ENQUIRIES ERROR:", error);
    res.status(500).send({
      success: false,
      message: "Error in DELETE ALL ENQUIRY API",
    });
  }
};

//TOTAL NUMBER OF ENQUIRY
export const totalNumberOfEnquiry = async (req, res) => {
  try {
    // count total enquiries
    const total = await enquiryModel.countDocuments();

    res.status(200).send({
      success: true,
      message: "Total enquiries fetched successfully",
      totalEnquiries: total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while fetching enquiries count",
    });
  }
};
