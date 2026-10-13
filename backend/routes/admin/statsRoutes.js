import express from "express";
import { protect } from "../../middleware/auth.js";
import { getStats } from "../../controllers/statsController.js";

const router = express.Router();

router.get("/", protect, getStats);

export default router;