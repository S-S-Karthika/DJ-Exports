import pool from "../config/db.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageStorage.js";
import { slugify, uniqueSlug } from "../utils/slug.js";

const clean = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const toBool = (v) => v === true || v === "true" || v === "1" || v === 1;

const validate = (b) => {
  const data = {
    name: clean(b.name),
    short_description: clean(b.short_description),
    description: clean(b.description),
    is_active: b.is_active === undefined ? 1 : toBool(b.is_active) ? 1 : 0,
  };

  const errors = {};
  if (!data.name) errors.name = "Name is required";
  else if (data.name.length > 100) errors.name = "Maximum 100 characters";
  if (data.short_description && data.short_description.length > 255) {
    errors.short_description = "Maximum 255 characters";
  }
  if (data.description && data.description.length > 3000) errors.description = "Maximum 3000 characters";

  const slugInput = clean(b.slug);
  const base = slugify(slugInput || data.name || "");
  if (!base) errors.slug = "Use letters or numbers in the name or URL";

  return { data, errors, base };
};

const SELECT_WITH_COUNT = `
  SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
  FROM categories c`;

const getCategory = async (id) => {
  const [rows] = await pool.query(`${SELECT_WITH_COUNT} WHERE c.id = ?`, [id]);
  return rows[0];
};

export const listCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_WITH_COUNT} ORDER BY c.sort_order, c.id`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load categories" });
  }
};

export const createCategory = async (req, res) => {
  const { data, errors, base } = validate(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Please fix the highlighted fields", errors });
  }

  let uploaded;
  try {
    data.slug = await uniqueSlug(pool, "categories", base);
    if (req.file) {
      uploaded = await uploadToImageKit(req.file, "categories");
      data.image = uploaded.url;
      data.image_file_id = uploaded.fileId;
    }
    const [[{ nextOrder }]] = await pool.query(
      "SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextOrder FROM categories"
    );
    const [result] = await pool.query("INSERT INTO categories SET ?", [{ ...data, sort_order: nextOrder }]);
    res.status(201).json(await getCategory(result.insertId));
  } catch (err) {
    console.error(err);
    if (uploaded) await deleteFromImageKit(uploaded.fileId);
    res.status(500).json({ message: "Failed to create category" });
  }
};

export const updateCategory = async (req, res) => {
  let uploaded;
  try {
    const existing = await getCategory(req.params.id);
    if (!existing) return res.status(404).json({ message: "Category not found" });

    const { data, errors, base } = validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }

    data.slug = await uniqueSlug(pool, "categories", base, existing.id);
    if (req.file) {
      uploaded = await uploadToImageKit(req.file, "categories");
      data.image = uploaded.url;
      data.image_file_id = uploaded.fileId;
    }

    await pool.query("UPDATE categories SET ? WHERE id = ?", [data, existing.id]);
    if (uploaded) await deleteFromImageKit(existing.image_file_id);

    res.json(await getCategory(existing.id));
  } catch (err) {
    console.error(err);
    if (uploaded) await deleteFromImageKit(uploaded.fileId);
    res.status(500).json({ message: "Failed to update category" });
  }
};

export const toggleCategory = async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE categories SET is_active = NOT is_active WHERE id = ?",
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Category not found" });
    res.json(await getCategory(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const existing = await getCategory(req.params.id);
    if (!existing) return res.status(404).json({ message: "Category not found" });

    // Never leave products without a category
    if (existing.product_count > 0) {
      return res.status(409).json({
        message: `This category has ${existing.product_count} product(s). Move or delete them first, or hide the category instead.`,
      });
    }

    await pool.query("DELETE FROM categories WHERE id = ?", [existing.id]);
    await deleteFromImageKit(existing.image_file_id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete category" });
  }
};

export const reorderCategories = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.every(Number.isInteger)) {
    return res.status(400).json({ message: "Invalid order" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < ids.length; i++) {
      await conn.query("UPDATE categories SET sort_order = ? WHERE id = ?", [i + 1, ids[i]]);
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