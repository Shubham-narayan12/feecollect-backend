import FeeStructure from "../model/feeStructureModel.js"


// CREATE FEE STRUCTURE
export const createFeeStructure = async (req, res) => {
  try {
    const {
      className,
      admissionFee,
      tuitionFee,
      annualFee,
      examFee,
      transportFee,
      extraFees,
    } = req.body;

    // Check exists
    const exists = await FeeStructure.findOne({ className });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Fee structure already exists for this class!",
      });
    }

    const newStructure = await FeeStructure.create({
      className,
      admissionFee,
      tuitionFee,
      annualFee,
      examFee,
      transportFee,
      extraFees,
    });

    return res.status(201).json({
      success: true,
      message: "Fee structure created successfully!",
      data: newStructure,
    });
  } catch (error) {
    console.log("Error creating fee structure:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

//GET FEE STRUCTURE BY CLASS
export const getFeeStructureByClass = async (req, res) => {
  try {
    const { className } = req.body;

    const structure = await FeeStructure.findOne({ className });

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found for this class!",
      });
    }

    res.status(200).json({
      success: true,
      structure,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//GET ALL FEE STRUCTURE
export const getAllFeeStructures = async (req, res) => {
  try {
    const structures = await FeeStructure.find().sort({ className: 1 });

    res.status(200).json({
      success: true,
      count: structures.length,
      data: structures,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE FEE STRUCTURE
export const updateFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = req.body;

    const updatedStructure = await FeeStructure.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );

    if (!updatedStructure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Fee structure updated successfully!",
      data: updatedStructure,
    });
  } catch (error) {
    console.error("Error updating fee structure:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// DELETE FEE STRUCTURE
export const deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await FeeStructure.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Fee structure deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

