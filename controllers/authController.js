import jwt from "jsonwebtoken";
import {
  siginSchema,
  signupSchema,
  acceptCodeSchema,
  changePasswordSchema,
  forgetPasswordSchema,
} from "../middlewares/validator.js";
// import nodemailer from "nodemailer";

import User from "../models/User.js";
import { compareHash, dohash } from "../Utils/hashing.js";
import { transport } from "../middlewares/sendMail.js";
import { hmacprocess } from "../Utils/hashing.js";
import bcrypt from "bcryptjs";
////// signup controller logic

export const register = async (req, res) => {
  const { name, profileImageUrl, adminInviteToken, email, password } = req.body;
  try {
    const { error, value } = signupSchema.validate({ email, password });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }
    let role = "member";
    if (
      adminInviteToken &&
      adminInviteToken == process.env.ADMIN_INVITE_TOKEN
    ) {
      role = "admin";
    }
    const hashpassword = await dohash(password, 10);
    const newuser = new User({
      email,
      password: hashpassword,
      name,
      profileImageUrl,
      role,
    });
    const result = await newuser.save();
    res.status(201).json({
      success: true,
      message: " Your account has been created successfully",
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

////// signin controller logic

export const signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = siginSchema.validate({ email, password });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: " User does not exists!" });
    }
    const result = await compareHash(password, existingUser.password);
    if (!result) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }
    const token = jwt.sign(
      {
        id: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "6d" }
    );
    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .json({
        success: true,
        name: existingUser.name,
        role: existingUser.role,
        token,
        message: "logged in successfully",
      });
  } catch (error) {
    console.error(error);
  }
};

////// signOut controller logic
export const signOut = (req, res) => {
  res
    .clearCookie("Authorization", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .status(200)
    .json({
      success: true,
      message: "Logged out successfully",
    });
};

////// verification controller logic

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: " User does not exists!" });
    }
    if (existingUser.verified) {
      return res
        .status(409)
        .json({ success: false, message: " you are already verified!" });
    }
    const codeVlue = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    let info = await transport.sendMail({
      from: process.env.SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "verification code",
      html: `
  <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding: 30px; text-align: center;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
      <h2 style="color: #0d47a1; font-size: 22px;">Email Verification Code</h2>
      <p style="font-size: 15px; color: #333; text-align: left;">
        Dear Customer,<br><br>
        To proceed with your request, please use the verification code below.  
        Do not share this code with anyone.
      </p>
      <div style="margin: 25px auto; font-size: 28px; font-weight: bold; color: #0d47a1; border: 2px solid #0d47a1; letter-spacing: 4px; display: inline-block; padding: 12px 24px; border-radius: 6px;">
        ${codeVlue}
      </div>
      <p style="font-size: 14px; color: #555; text-align: left;">
        This code is valid for <b>5 minutes</b>. After this time, it will expire automatically.
      </p>
      <p style="font-size: 13px; color: #888; text-align: left; margin-top: 20px;">
        If you did not request this verification, please ignore this email.
      </p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">
        © ${new Date().getFullYear()} SecureAuth Inc. All rights reserved.  
      </p>
    </div>
  </div>
`,
    });
    if (info.accepted.length > 0) {
      const hashedCodeValue = hmacprocess(
        codeVlue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now() + 5 * 60 * 1000;
      await existingUser.save();
      return res.status(200).json({ success: true, message: " Code Sent" });
    }
    res.status(400).json({ success: false, message: " Code Sent Failed !" });
  } catch (error) {
    console.error(error);
  }
};

export const verifyVerificationCode = async (req, res) => {
  const { email, providedCode } = req.body;
  try {
    const { error, value } = acceptCodeSchema.validate({ email, providedCode });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const codeVlue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: " User does not exists!" });
    }
    if (existingUser.verified) {
      return res
        .status(409)
        .json({ success: false, message: " you are already verified!" });
    }
    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "something is wrong with the code!" });
    }
    if (Date.now() > existingUser.verificationCodeValidation) {
      return res
        .status(400)
        .json({ success: false, message: "code has been expired!" });
    }
    const hashedCodeValue = hmacprocess(
      codeVlue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    if (hashedCodeValue === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();
      return res
        .status(200)
        .json({ success: true, message: " Your account has been verified" });
    }
    return res
      .status(400)
      .json({ success: false, message: " Unexpected occurred!" });
  } catch (error) {
    console.log(error);
  }
};

////// changePassword controller logic

export const changePassword = async (req, res) => {
  const { id, verified } = req.user;
  const { oldPassword, newPassword } = req.body;
  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    if (!verified) {
      return res
        .status(401)
        .json({ message: "you must verify your account first" });
    }
    const existingUser = await User.findOne({ _id: id }).select("+password");
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: " User does not exists!" });
    }
    const result = await compareHash(oldPassword, existingUser.password);
    if (!result) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }
    const hashedPassword = await dohash(newPassword, 10);
    existingUser.password = hashedPassword;
    await existingUser.save();
    return res
      .status(200)
      .json({ success: true, message: "The password has been updated!" });
  } catch (error) {}
};

////// ForgetPassword controller logic

export const sendForgetPasswordCode = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address!",
      });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exist!",
      });
    }
    if (
      existingUser.forgetPasswordCodeValidation &&
      Date.now() - existingUser.forgetPasswordCodeValidation < 60 * 1000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another code!",
      });
    }

    const codeValue = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");

    let info = await transport.sendMail({
      from: process.env.SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding: 30px; text-align: center;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h2 style="color: #0d47a1; font-size: 22px;">Password Reset Code</h2>
            <p style="font-size: 15px; color: #333; text-align: left;">
              Dear Customer,<br><br>
              You have requested to reset your password. Please use the verification code below to proceed.  
              Do not share this code with anyone.
            </p>
            <div style="margin: 25px auto; font-size: 28px; font-weight: bold; color: #0d47a1; border: 2px solid #0d47a1; letter-spacing: 4px; display: inline-block; padding: 12px 24px; border-radius: 6px;">
              ${codeValue}
            </div>
            <p style="font-size: 14px; color: #555; text-align: left;">
              This code is valid for <b>5 minutes</b>. After this time, it will expire automatically.
            </p>
            <p style="font-size: 13px; color: #888; text-align: left; margin-top: 20px;">
              If you did not request this password reset, please ignore this email and your password will remain unchanged.
            </p>
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} SecureAuth Inc. All rights reserved.  
            </p>
          </div>
        </div>
      `,
    });

    if (info.accepted.length > 0) {
      const hashedCodeValue = hmacprocess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );

      existingUser.forgetPasswordCode = hashedCodeValue;
      existingUser.forgetPasswordCodeValidation = Date.now(); // Store creation time

      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: "Password reset code sent to your email!",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Failed to send password reset code!",
    });
  } catch (error) {
    console.error("Error sending password reset code:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred!",
    });
  }
};

export const verifyForgetPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;

  try {
    const { error, value } = forgetPasswordSchema.validate({
      email,
      providedCode,
      newPassword,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const codeValue = providedCode.toString();

    const existingUser = await User.findOne({ email }).select(
      "+forgetPasswordCode +forgetPasswordCodeValidation"
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exist!",
      });
    }
    if (
      !existingUser.forgetPasswordCode ||
      !existingUser.forgetPasswordCodeValidation
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing reset code!",
      });
    }

    if (
      Date.now() - existingUser.forgetPasswordCodeValidation >
      5 * 60 * 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Reset code has expired!",
      });
    }

    const hashedCodeValue = hmacprocess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCodeValue === existingUser.forgetPasswordCode) {
      const hashedPassword = await dohash(newPassword, 10);

      existingUser.password = hashedPassword;
      existingUser.forgetPasswordCode = undefined;
      existingUser.forgetPasswordCodeValidation = undefined;

      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: "Password has been reset successfully!",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid reset code!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred!",
    });
  }
};

////// getUserProfile controller logic

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred!",
    });
  }
};

////// updateEmail controller logic

export const updateEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    // جِب المستخدم من الـ DB
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // تحقق من الباسورد
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // تحقق من إن الإيميل مش مستخدم قبل كده
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // حدث الإيميل
    user.email = newEmail;
    await user.save(); // مهم جدا

    return res.json({
      success: true,
      message: "Email updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

////// updateProfileInfo controller logic

export const updateProfileInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // تحديث الاسم
    if (req.body.name) {
      user.name = req.body.name;
    }

    // تحديث الصورة (ممكن تكون URL أو path جاي من خدمة رفع زي Cloudinary)
    if (req.body.image) {
      user.image = req.body.image;
    }

    const result = await user.save();

    res.json({
      _id: result._id,
      name: result.name,
      email: result.email,
      image: result.image,
      role: result.role,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred!",
    });
  }
};
