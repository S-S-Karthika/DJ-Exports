import express from "express";
import { protect } from "../../middleware/auth.js";
import { uploadArray } from "../../middleware/upload.js";
import {
  MAX_BATCH, listGallery, uploadGallery, updateGalleryItem,
  toggleGalleryItem, deleteGalleryItem, reorderGallery,
} from "../../controllers/galleryController.js";

const router = express.Router();

router.use(protect);

router.get("/", listGallery);
router.post("/", uploadArray("images", MAX_BATCH), uploadGallery);
router.put("/reorder", reorderGallery);
router.put("/:id", updateGalleryItem);
router.patch("/:id/toggle", toggleGalleryItem);
router.delete("/:id", deleteGalleryItem);

export default router;