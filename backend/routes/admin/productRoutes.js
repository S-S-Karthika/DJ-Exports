import express from "express";
import { protect } from "../../middleware/auth.js";
import { uploadArray } from "../../middleware/upload.js";
import {
  MAX_IMAGES, listProducts, getProductAdmin, createProduct, updateProduct,
  toggleProduct, toggleFeatured, deleteProduct, setPrimaryImage, deleteProductImage,
} from "../../controllers/productController.js";

const router = express.Router();

router.use(protect);

router.get("/", listProducts);
router.get("/:id", getProductAdmin);
router.post("/", uploadArray("images", MAX_IMAGES), createProduct);
router.put("/:id", uploadArray("images", MAX_IMAGES), updateProduct);
router.patch("/:id/toggle", toggleProduct);
router.patch("/:id/featured", toggleFeatured);
router.delete("/:id", deleteProduct);
router.patch("/:id/images/:imageId/primary", setPrimaryImage);
router.delete("/:id/images/:imageId", deleteProductImage);

export default router;