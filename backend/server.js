import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import adminSettingsRoutes from "./routes/admin/settingsRoutes.js";
import adminHeroSlideRoutes from "./routes/admin/heroSlideRoutes.js";
import adminCertificateRoutes from "./routes/admin/certificateRoutes.js";
import adminAboutRoutes from "./routes/admin/aboutRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import adminInquiryRoutes from "./routes/admin/inquiryRoutes.js";
import adminCategoryRoutes from "./routes/admin/categoryRoutes.js";
import adminProductRoutes from "./routes/admin/productRoutes.js";
import adminStatsRoutes from "./routes/admin/statsRoutes.js";
import adminGalleryRoutes from "./routes/admin/galleryRoutes.js";
import adminBrandRoutes from "./routes/admin/brandRoutes.js";


dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/admin/hero-slides", adminHeroSlideRoutes);
app.use("/api/admin/certificates", adminCertificateRoutes);
app.use("/api/admin/about", adminAboutRoutes);  
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/admin/inquiries", adminInquiryRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/stats", adminStatsRoutes);
app.use("/api/admin/gallery", adminGalleryRoutes);
app.use("/api/admin/brand", adminBrandRoutes);


// Health check: confirms server + database both work
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM categories");
    res.json({ status: "ok", db: "connected", categories: rows[0].total });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));