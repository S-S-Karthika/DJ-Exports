import express from "express";
import { protect } from "../../middleware/auth.js";
import { uploadSingle } from "../../middleware/upload.js";
import {
  listCategories, createCategory, updateCategory,
  toggleCategory, deleteCategory, reorderCategories,
} from "../../controllers/categoryController.js";

const router = express.Router();

router.use(protect);

router.get("/", listCategories);
router.post("/", uploadSingle("image"), createCategory);
router.put("/reorder", reorderCategories);
router.put("/:id", uploadSingle("image"), updateCategory);
router.patch("/:id/toggle", toggleCategory);
router.delete("/:id", deleteCategory);

export default router;