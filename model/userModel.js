import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    // 👤 Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      trim: true,
    },

    // 🔐 Auth
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // security 🔒
    },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
      default: "ADMIN",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    // 🔑 Permissions (future-proof)
    permissions: {
      canCreateStudent: { type: Boolean, default: true },
      canBulkUpload: { type: Boolean, default: true },
      canManageFees: { type: Boolean, default: true },
      canViewReports: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

//
// 🔐 Password Hash (before save)
//
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//
// 🔑 Compare Password (login ke liye)
//
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Admin", adminSchema);
