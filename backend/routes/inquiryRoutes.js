import express from "express";
import rateLimit from "express-rate-limit";
import { createInquiry } from "../controllers/inquiryController.js";

const router = express.Router();

// Max 5 inquiries per 15 minutes from the same visitor (stops spam)
const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: "Too many inquiries. Please try again later, or contact us on WhatsApp." },
});

router.post("/", inquiryLimiter, createInquiry);

export default router;