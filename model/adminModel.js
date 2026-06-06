import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";

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
  },
  { timestamps: true },
);

//
// 🔐 Password Hash (before save)
//
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// 🔑 Compare Password (login ke liye)
//
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//JWT TOKEN
adminSchema.methods.generateToken = function () {
  return JWT.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export default mongoose.model("Admin", adminSchema);
