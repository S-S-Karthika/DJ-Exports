import pool from "../config/db.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageStorage.js";

const clean = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const toBool = (v) => v === true || v === "true" || v === "1" || v === 1;

const validate = (b) => {
  const data = {
    subtitle: clean(b.subtitle),
    title: clean(b.title),
    button_text: clean(b.button_text),
    button_link: clean(b.button_link),
    is_active: b.is_active === undefined ? 1 : toBool(b.is_active) ? 1 : 0,
  };

  const errors = {};
  if (!data.title) errors.title = "Title is required";
  else if (data.title.length > 200) errors.title = "Maximum 200 characters";
  if (data.subtitle && data.subtitle.length > 150) errors.subtitle = "Maximum 150 characters";
  if (data.button_text && data.button_text.length > 50) errors.button_text = "Maximum 50 characters";
  if (data.button_link && !/^(\/|https:\/\/)/.test(data.button_link)) {
    errors.button_link = "Use a page path like /contact or a full https:// link";
  }
  if (data.button_text && !data.button_link) errors.button_link = "Add a link for the button";

  return { data, errors };
};

const getSlide = async (id) => {
  const [rows] = await pool.query("SELECT * FROM hero_slides WHERE id = ?", [id]);
  return rows[0];
};

export const listSlides = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM hero_slides ORDER BY sort_order, id");
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Failed to load banners" });
  }
};

export const createSlide = async (req, res) => {
  const { data, errors } = validate(req.body);
  if (!req.file) errors.image = "Banner image is required";
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Please fix the highlighted fields", errors });
  }

  let uploaded;
  try {
    uploaded = await uploadToImageKit(req.file, "hero");
    const [[{ nextOrder }]] = await pool.query(
      "SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextOrder FROM hero_slides"
    );
    const [result] = await pool.query("INSERT INTO hero_slides SET ?", [
      { ...data, image: uploaded.url, image_file_id: uploaded.fileId, sort_order: nextOrder },
    ]);
    res.status(201).json(await getSlide(result.insertId));
  } catch (err) {
    console.error(err);
    if (uploaded) await deleteFromImageKit(uploaded.fileId);
    res.status(500).json({ message: "Failed to create banner" });
  }
};

export const updateSlide = async (req, res) => {
  let uploaded;
  try {
    const existing = await getSlide(req.params.id);
    if (!existing) return res.status(404).json({ message: "Banner not found" });

    const { data, errors } = validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }

    if (req.file) {
      uploaded = await uploadToImageKit(req.file, "hero");
      data.image = uploaded.url;
      data.image_file_id = uploaded.fileId;
    }

    await pool.query("UPDATE hero_slides SET ? WHERE id = ?", [data, existing.id]);

    // Old image is removed only after the DB update succeeded
    if (uploaded) await deleteFromImageKit(existing.image_file_id);

    res.json(await getSlide(existing.id));
  } catch (err) {
    console.error(err);
    if (uploaded) await deleteFromImageKit(uploaded.fileId);
    res.status(500).json({ message: "Failed to update banner" });
  }
};

export const toggleSlide = async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE hero_slides SET is_active = NOT is_active WHERE id = ?",
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Banner not found" });
    res.json(await getSlide(req.params.id));
  } catch {
    res.status(500).json({ message: "Failed to update banner" });
  }
};

export const deleteSlide = async (req, res) => {
  try {
    const existing = await getSlide(req.params.id);
    if (!existing) return res.status(404).json({ message: "Banner not found" });

    await pool.query("DELETE FROM hero_slides WHERE id = ?", [existing.id]);
    await deleteFromImageKit(existing.image_file_id);
    res.json({ message: "Banner deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete banner" });
  }
};

export const reorderSlides = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.every(Number.isInteger)) {
    return res.status(400).json({ message: "Invalid order" });
  }

  // Transaction: either every position saves, or none do
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < ids.length; i++) {
      await conn.query("UPDATE hero_slides SET sort_order = ? WHERE id = ?", [i + 1, ids[i]]);
    }
    await conn.commit();
    res.json({ message: "Order saved" });
  } catch {
    await conn.rollback();
    res.status(500).json({ message: "Failed to save order" });
  } finally {
    conn.release();
  }
};