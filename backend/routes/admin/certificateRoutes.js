import express from "express";
import { protect } from "../../middleware/auth.js";
import { uploadSingle } from "../../middleware/upload.js";
import {
  listCertificates, createCertificate, updateCertificate,
  toggleCertificate, deleteCertificate, reorderCertificates,
} from "../../controllers/certificateController.js";

const router = express.Router();

router.use(protect);

router.get("/", listCertificates);
router.post("/", uploadSingle("image"), createCertificate);
router.put("/reorder", reorderCertificates);
router.put("/:id", uploadSingle("image"), updateCertificate);
router.patch("/:id/toggle", toggleCertificate);
router.delete("/:id", deleteCertificate);

export default router;