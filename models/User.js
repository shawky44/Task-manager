import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, require: true },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [5, "Email must be at least 5 characters"], 
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },
    profileImageUrl: { type: String, default: null },
    role: { type: String, enum: ["admin", "member"], default: "member" },
        verified: {
      type: Boolean,
      default: false,
    },
    verificationCodeValidation: {
      type: Number,
      select: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    forgetPasswordCodeValidation: {
      type: Number,
      select: false,
    },
    forgetPasswordCode: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", UserSchema);
