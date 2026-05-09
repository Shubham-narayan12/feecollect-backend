import FeeLedger from "../model/FeeLedgerModel.js";
import Student from "../model/studentModel.js";

//AUTO CREATION
export const createAutoLedger = async (student, recommendedFees = []) => {
  try {
    // 1️⃣ Check Ledger Exists
    const existingLedger = await FeeLedger.findOne({
      studentId: student._id,
    });
    if (existingLedger) {
      return existingLedger;
    }

    // 2️⃣ Prepare Recommended Fees (only if benefit enabled)
    let finalRecommendedFees = [];

    if (
      student.feeBenefit?.hasFeeBenefit === true &&
      Array.isArray(recommendedFees) &&
      recommendedFees.length > 0
    ) {
      finalRecommendedFees = recommendedFees;
    }

    // 3️⃣ Create Ledger
    const newLedger = await FeeLedger.create({
      studentId: student._id,
      session: student.session,
      className: student.className,
      section: student.section || "",

      admissionFee: {
        amount: 0,
        status: "Unpaid",
        paidAmount: 0,
        dueAmount: 0,
      },

      annualFee: {
        amount: 0,
        status: "Unpaid",
        paidAmount: 0,
        dueAmount: 0,
      },

      monthlyRecords: [],
      extraFees: [],

      // ⭐ Recommended Fees (ONLY REFERENCE)
      recommendedFees: finalRecommendedFees,

      lastPaymentDate: null,
    });

    return newLedger;
  } catch (error) {
    console.error("Auto Ledger Create Error:", error);
    throw new Error("Failed to create auto ledger.");
  }
};

//COLLECT FEE
export const collectFee = async (req, res) => {
  try {
    const {
      studentId,
      monthlyRecords,
      admissionFee,
      annualFee,
      extraFees,
      paidAmount,
    } = req.body;

    let ledger = await FeeLedger.findOne({ studentId });
    if (!ledger) return res.status(404).json({ message: "Ledger not found" });

    let totalBill = 0;

    // 1️⃣ Admission Fee
    if (admissionFee) {
      ledger.admissionFee.amount = admissionFee;
      ledger.admissionFee.paidAmount = admissionFee;
      ledger.admissionFee.dueAmount = 0;
      ledger.admissionFee.status = "Paid";
      totalBill += admissionFee;
    }

    // 2️⃣ Annual Fee
    if (annualFee) {
      ledger.annualFee.amount = annualFee;
      ledger.annualFee.paidAmount = annualFee;
      ledger.annualFee.dueAmount = 0;
      ledger.annualFee.status = "Paid";
      totalBill += annualFee;
    }

    // 3️⃣ Monthly Records Update - FIXED
    if (monthlyRecords && Array.isArray(monthlyRecords)) {
      monthlyRecords.forEach((m) => {
        const monthRecord = ledger.monthlyRecords.find(
          (rec) => rec.month === m.month && rec.year === m.year,
        );

        if (monthRecord) {
          // Update values
          monthRecord.tuitionFee = m.tuitionFee ?? monthRecord.tuitionFee;
          monthRecord.transportFee = m.transportFee ?? monthRecord.transportFee;

          const monthTotal =
            (monthRecord.tuitionFee || 0) + (monthRecord.transportFee || 0);

          monthRecord.paidAmount = monthTotal;

          monthRecord.status = "Paid";

          totalBill += monthTotal;
        } else {
          // Agar record nahi mila toh naya add karo
          const monthTotal = (m.tuitionFee || 0) + (m.transportFee || 0);
          ledger.monthlyRecords.push({
            month: m.month,
            year: m.year,
            tuitionFee: m.tuitionFee || 0,
            transportFee: m.transportFee || 0,
            paidAmount: monthTotal,
            status: "Paid",
          });
          totalBill += monthTotal;
        }
      });

      // ✅ IMPORTANT: Mark the array as modified
      ledger.markModified("monthlyRecords");
    }

    // 4️⃣ Extra Fees (Exam, Books, Uniform)
    if (extraFees && Array.isArray(extraFees)) {
      extraFees.forEach((ef) => {
        ledger.extraFees.push({
          title: ef.title,
          amount: ef.amount,
          status: "Paid", // ✅ Status add karo
        });

        totalBill += ef.amount;
      });

      // ✅ Mark extraFees as modified bhi
      ledger.markModified("extraFees");
    }

    // 5️⃣ Validate Paid Amount
    if (paidAmount > totalBill) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be greater than total bill",
        totalBill,
        paidAmount,
      });
    }

    // 5️⃣ Calculate current due amount
    const currentDue = Math.max(totalBill - paidAmount, 0);

    // 6️⃣ Add to Payment History (NEW - Model me added hai)
    ledger.paymentHistory.push({
      paidAmount: paidAmount,
      dueAmount: currentDue,
      date: new Date(),
    });

    // 7️⃣ Update Last Payment Date
    ledger.lastPaymentDate = new Date();

    await ledger.save();

    return res.status(200).json({
      success: true,
      message: "Fee collected successfully",
      totalBill,
      paidAmount,
      currentDue: currentDue, // Changed from "pending"
      paymentAddedToHistory: true,
      ledger,
    });
  } catch (error) {
    console.error("Fee Collect Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET LEDGER OF SINGLE STUDENT
export const getLedgerByStudentId = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = id;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // 1️⃣ Fetch student details
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // 2️⃣ Fetch ledger
    const ledger = await FeeLedger.findOne({ studentId });

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: "Ledger not found",
      });
    }

    // ⭐ SAFE ARRAY FALLBACKS
    const monthlyRecords = Array.isArray(ledger.monthlyRecords)
      ? ledger.monthlyRecords
      : [];

    const extraFees = Array.isArray(ledger.extraFees) ? ledger.extraFees : [];

    const paymentHistory = Array.isArray(ledger.paymentHistory)
      ? ledger.paymentHistory
      : [];

    // 3️⃣ SUMMARY CALCULATION
    const totalMonthlyPaid = monthlyRecords.reduce(
      (sum, r) => sum + (r.paidAmount || 0),
      0,
    );

    const totalMonthlyDue = monthlyRecords.reduce(
      (sum, r) => sum + (r.dueAmount || 0),
      0,
    );

    const totalExtraPaid = extraFees.reduce(
      (sum, r) => sum + (r.amount && r.status === "Paid" ? r.amount : 0),
      0,
    );

    const totalExtraDue = extraFees.reduce(
      (sum, r) => sum + (r.amount && r.status === "Unpaid" ? r.amount : 0),
      0,
    );

    const admissionDue = ledger.admissionFee.dueAmount || 0;
    const annualDue = ledger.annualFee.dueAmount || 0;

    const admissionPaid = ledger.admissionFee.paidAmount || 0;
    const annualPaid = ledger.annualFee.paidAmount || 0;

    // GRAND TOTALS
    const grandTotalPaid =
      totalMonthlyPaid + totalExtraPaid + admissionPaid + annualPaid;

    const grandTotalDue =
      totalMonthlyDue + totalExtraDue + admissionDue + annualDue;

    // 4️⃣ Final Response
    return res.status(200).json({
      success: true,

      studentDetails: {
        id: student._id,
        name: student.studentName,
        class: student.className,
        section: student.section,
        fatherName: student.fatherName,
        motherName: student.motherName,
        mobile: student.mobile,
      },

      ledger: {
        admissionFee: ledger.admissionFee,
        annualFee: ledger.annualFee,
        monthlyRecords,
        extraFees,
        lastPaymentDate: ledger.lastPaymentDate,
        paymentHistory,
      },

      summary: {
        totalMonthlyPaid,
        totalMonthlyDue,

        totalExtraPaid,
        totalExtraDue,

        admissionPaid,
        admissionDue,

        annualPaid,
        annualDue,

        grandTotalPaid,
        grandTotalDue,
      },
    });
  } catch (error) {
    console.error("Error in getLedgerByStudentId:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

//ADD RECOMMENDED FEE FOR INDIVUAL STUDENT
export const createRecommendedFeeForIndivualStudent = async (req, res) => {
  try {
    const { studentId, recommendedFees, description } = req.body;

    if (!studentId || !recommendedFees || recommendedFees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "studentId and recommendedFees are required",
      });
    }

    // 🔹 1. Update Student feeBenefit
    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          "feeBenefit.hasFeeBenefit": true,
          "feeBenefit.description": description || "Recommended fee approved",
          "feeBenefit.approvedAt": new Date(),
        },
      },
      { new: true },
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // 🔹 2. Update Recommended Fees in FeeLedger
    const ledger = await FeeLedger.findOneAndUpdate(
      { studentId },
      {
        $set: {
          recommendedFees: recommendedFees,
        },
      },
      { new: true },
    );

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: "Fee ledger not found for this student",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recommended fee created successfully",
      student,
      recommendedFees: ledger.recommendedFees,
    });
  } catch (error) {
    console.error("Create Recommended Fee Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteOneRecommendedFee = async (req, res) => {
  try {
    const { studentId, recommendedFeeId } = req.params;

    if (!studentId || !recommendedFeeId) {
      return res.status(400).json({
        success: false,
        message: "studentId and recommendedFeeId are required",
      });
    }

    // 🔹 Find ledger
    const ledger = await FeeLedger.findOne({ studentId });

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: "Fee ledger not found",
      });
    }

    // 🔹 Check if recommended fee exists
    const feeExists = ledger.recommendedFees.some(
      (fee) => fee._id.toString() === recommendedFeeId,
    );

    if (!feeExists) {
      return res.status(404).json({
        success: false,
        message: "Recommended fee not found",
      });
    }

    // 🔹 Remove one recommended fee
    ledger.recommendedFees = ledger.recommendedFees.filter(
      (fee) => fee._id.toString() !== recommendedFeeId,
    );

    await ledger.save();

    // 🔹 If no recommended fee left → disable feeBenefit
    if (ledger.recommendedFees.length === 0) {
      await Student.findByIdAndUpdate(studentId, {
        $set: {
          "feeBenefit.hasFeeBenefit": false,
        },
        $unset: {
          "feeBenefit.description": "",
          "feeBenefit.approvedAt": "",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Recommended fee deleted successfully",
      recommendedFees: ledger.recommendedFees,
    });
  } catch (error) {
    console.error("Delete Recommended Fee Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
