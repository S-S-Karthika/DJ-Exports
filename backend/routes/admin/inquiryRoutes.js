import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  listInquiries, updateInquiryStatus, updateInquiryNote, deleteInquiry,
} from "../../controllers/inquiryController.js";

const router = express.Router();

router.use(protect);

router.get("/", listInquiries);
router.patch("/:id/status", updateInquiryStatus);
router.patch("/:id/note", updateInquiryNote);
router.delete("/:id", deleteInquiry);

export default router;