import express from "express";
import { protect } from "../../middleware/auth.js";
import { uploadSingle } from "../../middleware/upload.js";
import {
  listSlides, createSlide, updateSlide, toggleSlide, deleteSlide, reorderSlides,
} from "../../controllers/heroSlideController.js";

const router = express.Router();

router.use(protect);

router.get("/", listSlides);
router.post("/", uploadSingle("image"), createSlide);
router.put("/reorder", reorderSlides);
router.put("/:id", uploadSingle("image"), updateSlide);
router.patch("/:id/toggle", toggleSlide);
router.delete("/:id", deleteSlide);

export default router;