import express from "express";
import {
  register,
  signIn,
  signOut,
  sendVerificationCode,
  verifyVerificationCode,
  changePassword,
  sendForgetPasswordCode,
  verifyForgetPasswordCode,
  getUserProfile,
  updateEmail,
  updateProfileInfo,
} from "../controllers/authController.js";
import { identifier } from "../middlewares/identification.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadmiddleware.js";
const router = express.Router();

// Define your authentication routes here

router.post("/register", register);
router.post("/signin", signIn);
router.post("/signout", identifier, signOut);
router.get("/profile", protect, getUserProfile);
router.put("/profile/update-email", protect, updateEmail);
router.put("/profile", protect, updateProfileInfo);

router.patch("/sendVerificationCode", identifier, sendVerificationCode);
router.patch("/verifyVerificationCode", identifier, verifyVerificationCode);

router.patch("/changePassword", identifier, changePassword);

router.patch("/verifyforgetPasswordCode", verifyForgetPasswordCode);
router.patch("/sendforgetPasswordCode", sendForgetPasswordCode);

router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.status(200).json({ imageUrl });
});

export default router;
