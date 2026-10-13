import express from "express";
import { protect } from "../../middleware/auth.js";
import { uploadSingle } from "../../middleware/upload.js";
import { getLogo, uploadLogo, removeLogo } from "../../controllers/brandController.js";

const router = express.Router();

router.use(protect);

router.get("/", getLogo);
router.put("/", uploadSingle("logo"), uploadLogo);
router.delete("/", removeLogo);

export default router;