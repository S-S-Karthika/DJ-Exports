import express from "express";
import { protect } from "../../middleware/auth.js";
import { uploadFields } from "../../middleware/upload.js";
import { getAbout, updateAbout, ABOUT_IMAGE_FIELDS } from "../../controllers/aboutController.js";

const router = express.Router();

router.use(protect);

router.get("/", getAbout);
router.put("/", uploadFields(ABOUT_IMAGE_FIELDS), updateAbout);

export default router;