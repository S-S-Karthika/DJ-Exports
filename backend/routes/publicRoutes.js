import express from "express";
import {
  getSettings,
  getCategories,
  getHeroSlides,
  getCertificates,
  getAboutContent,
  getProducts,
  getProductBySlug,
  getGallery,
  getFavicon,
} from "../controllers/publicController.js";

const router = express.Router();

router.get("/settings", getSettings);
router.get("/categories", getCategories);
router.get("/hero-slides", getHeroSlides);
router.get("/certificates", getCertificates);
router.get("/about", getAboutContent);
router.get("/products", getProducts);
router.get("/products/:slug", getProductBySlug);
router.get("/gallery", getGallery);
router.get("/favicon", getFavicon);

export default router;