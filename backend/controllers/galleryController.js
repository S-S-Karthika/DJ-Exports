import pool from "../config/db.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageStorage.js";

export const GALLERY_SECTIONS = ["details", "production", "quality", "packing", "samples", "team"];
export const MAX_BATCH = 20;

const clean = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

const getItem = async (id) => {
  const [rows] = await pool.query("SELECT * FROM gallery WHERE id = ?", [id]);
  return rows[0];
};

export const listGallery = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM gallery ORDER BY sort_order, id");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load gallery" });
  }
};

// Bulk upload. If some photos fail, the rest are still saved.
export const uploadGallery = async (req, res) => {
  const files = req.files || [];
  const section = GALLERY_SECTIONS.includes(req.body.section) ? req.body.section : null;

  const errors = {};
  if (!files.length) errors.images = "Choose at least one photo";
  if (!section) errors.section = "Choose a section";
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Please fix the highlighted fields", errors });
  }

  const settled = await Promise.allSettled(files.map((f) => uploadToImageKit(f, "gallery")));
  const uploaded = settled.filter((s) => s.status === "fulfilled").map((s) => s.value);
  const failed = files.length - uploaded.length;
  if (!uploaded.length) return res.status(500).json({ message: "Upload failed. Please try again." });

  try {
    const [[{ nextOrder }]] = await pool.query(
      "SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextOrder FROM gallery"
    );
    const rows = uploaded.map((u, i) => [section, u.url, u.fileId, u.width || null, u.height || null, nextOrder + i]);
    await pool.query(
      "INSERT INTO gallery (section, image, image_file_id, width, height, sort_order) VALUES ?",
      [rows]
    );
    const [created] = await pool.query(
      "SELECT * FROM gallery WHERE image_file_id IN (?) ORDER BY sort_order",
      [uploaded.map((u) => u.fileId)]
    );
    res.status(201).json({ created, failed });
  } catch (err) {
    console.error(err);
    await Promise.all(uploaded.map((u) => deleteFromImageKit(u.fileId)));
    res.status(500).json({ message: "Failed to save photos" });
  }
};

// Edit caption and section (JSON, no image)
export const updateGalleryItem = async (req, res) => {
  const title = clean(req.body.title);
  const section = req.body.section;
  const errors = {};
  if (title && title.length > 150) errors.title = "Maximum 150 characters";
  if (!GALLERY_SECTIONS.includes(section)) errors.section = "Choose a section";
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Please fix the highlighted fields", errors });
  }

  try {
    const [result] = await pool.query("UPDATE gallery SET title = ?, section = ? WHERE id = ?", [
      title,
      section,
      req.params.id,
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: "Photo not found" });
    res.json(await getItem(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update photo" });
  }
};

export const toggleGalleryItem = async (req, res) => {
  try {
    const [result] = await pool.query("UPDATE gallery SET is_active = NOT is_active WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Photo not found" });
    res.json(await getItem(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update photo" });
  }
};

export const deleteGalleryItem = async (req, res) => {
  try {
    const existing = await getItem(req.params.id);
    if (!existing) return res.status(404).json({ message: "Photo not found" });
    await pool.query("DELETE FROM gallery WHERE id = ?", [existing.id]);
    await deleteFromImageKit(existing.image_file_id);
    res.json({ message: "Photo deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete photo" });
  }
};

export const reorderGallery = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.every(Number.isInteger)) {
    return res.status(400).json({ message: "Invalid order" });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < ids.length; i++) {
      await conn.query("UPDATE gallery SET sort_order = ? WHERE id = ?", [i + 1, ids[i]]);
    }
    await conn.commit();
    res.json({ message: "Order saved" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Failed to save order" });
  } finally {
    conn.release();
  }
};