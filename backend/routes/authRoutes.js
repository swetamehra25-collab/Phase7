import express from "express";

import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/preferences", authMiddleware, updatePreferences);
router.put("/password", authMiddleware, changePassword);

export default router;
