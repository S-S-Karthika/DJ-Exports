import express from "express";
import rateLimit from "express-rate-limit";
import { login, getMe, updateProfile, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,                // 10 attempts per IP
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

router.post("/login", loginLimiter, login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/password", protect, changePassword);

export default router;