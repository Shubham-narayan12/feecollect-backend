// ==========================================
// controllers/noticeController.js
// ==========================================

import noticeModel from "../model/noticeModel.js";

// ==========================================
// CREATE NOTICE
// ==========================================
export const createNotice = async (req, res) => {
  try {
    const { notice } = req.body;

    if (!notice) {
      return res.status(400).json({
        success: false,
        message: "Notice is required",
      });
    }

    const newNotice = await noticeModel.create({
      notice,
    });

    res.status(201).json({
      success: true,
      message: "Notice created successfully",
      noticeData: newNotice,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL NOTICE
// ==========================================
export const getAllNotice = async (req, res) => {
  try {
    const notices = await noticeModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalNotice: notices.length,
      notices,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET SINGLE NOTICE
// ==========================================
export const getSingleNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await noticeModel.findById(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    res.status(200).json({
      success: true,
      notice,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE NOTICE
// ==========================================
export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const { notice } = req.body;

    const updatedNotice = await noticeModel.findByIdAndUpdate(
      id,
      {
        notice,
      },
      {
        new: true,
      },
    );

    if (!updatedNotice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notice updated successfully",
      notice: updatedNotice,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE NOTICE
// ==========================================
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedNotice = await noticeModel.findByIdAndDelete(id);

    if (!deletedNotice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
