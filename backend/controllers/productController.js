import pool from "../config/db.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageStorage.js";
import { slugify, uniqueSlug } from "../utils/slug.js";

export const MAX_IMAGES = 8;

const LIMITS = {
  name: 150, short_description: 255, description: 5000, material: 150,
  gsm: 50, size: 150, colors: 255, moq: 100, packaging: 255,
};

const clean = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const toBool = (v) => v === true || v === "true" || v === "1" || v === 1;

// Custom specs arrive as a JSON string: [{"label":"Weave","value":"Waffle"}]
const parseSpecs = (raw) => {
  if (!raw) return { specs: [] };
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return { error: "Invalid specifications" };
    const specs = arr
      .map((s) => ({ label: clean(s?.label), value: clean(s?.value) }))
      .filter((s) => s.label && s.value);
    if (specs.length > 15) return { error: "Maximum 15 extra specifications" };
    if (specs.some((s) => s.label.length > 60 || s.value.length > 200)) {
      return { error: "Labels max 60 characters, values max 200" };
    }
    return { specs };
  } catch {
    return { error: "Invalid specifications" };
  }
};

const validate = async (b) => {
  const data = {};
  const errors = {};

  for (const [field, max] of Object.entries(LIMITS)) {
    const v = clean(b[field]);
    if (v && v.length > max) errors[field] = `Maximum ${max} characters`;
    data[field] = v;
  }
  if (!data.name) errors.name = "Name is required";

  const catId = Number(b.category_id);
  if (!Number.isInteger(catId) || catId < 1) {
    errors.category_id = "Choose a category";
  } else {
    const [rows] = await pool.query("SELECT id FROM categories WHERE id = ?", [catId]);
    if (!rows.length) errors.category_id = "Category not found";
    else data.category_id = catId;
  }

  const { specs, error } = parseSpecs(b.specifications);
  if (error) errors.specifications = error;
  // mysql2 can't insert a JS array directly into a JSON column, so stringify it
  else data.specifications = JSON.stringify(specs);

  data.is_active = b.is_active === undefined ? 1 : toBool(b.is_active) ? 1 : 0;
  data.is_featured = toBool(b.is_featured) ? 1 : 0;

  const base = slugify(clean(b.slug) || data.name || "");
  if (!base) errors.slug = "Use letters or numbers in the name or URL";

  return { data, errors, base };
};

const getProduct = async (id) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`,
    [id]
  );
  if (!rows[0]) return null;
  const [images] = await pool.query(
    `SELECT id, image, is_primary, sort_order FROM product_images
     WHERE product_id = ? ORDER BY is_primary DESC, sort_order, id`,
    [id]
  );
  return { ...rows[0], images };
};

// Uploads all files; if any fails, removes the ones that succeeded
const uploadMany = async (files) => {
  const settled = await Promise.allSettled(files.map((f) => uploadToImageKit(f, "products")));
  const ok = settled.filter((s) => s.status === "fulfilled").map((s) => s.value);
  if (ok.length !== files.length) {
    await Promise.all(ok.map((u) => deleteFromImageKit(u.fileId)));
    throw new Error("Image upload failed");
  }
  return ok;
};

/* ---------- List & read ---------- */

export const listProducts = async (req, res) => {
  try {
    const { q, category_id } = req.query;
    const where = [];
    const params = [];
    if (q) {
      where.push("p.name LIKE ?");
      params.push(`%${q}%`);
    }
    if (Number(category_id) > 0) {
      where.push("p.category_id = ?");
      params.push(Number(category_id));
    }

    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.gsm, p.moq, p.is_active, p.is_featured, p.created_at,
              c.name AS category_name,
              (SELECT image FROM product_images pi WHERE pi.product_id = p.id
               ORDER BY pi.is_primary DESC, pi.sort_order, pi.id LIMIT 1) AS image,
              (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) AS image_count
       FROM products p JOIN categories c ON c.id = p.category_id
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY p.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load products" });
  }
};

export const getProductAdmin = async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load product" });
  }
};

/* ---------- Create & update ---------- */

export const createProduct = async (req, res) => {
  let uploaded = [];
  try {
    const { data, errors, base } = await validate(req.body);
    const files = req.files || [];
    if (files.length > MAX_IMAGES) errors.images = `Maximum ${MAX_IMAGES} images`;
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }

    data.slug = await uniqueSlug(pool, "products", base);
    uploaded = await uploadMany(files);

    const conn = await pool.getConnection();
    let productId;
    try {
      await conn.beginTransaction();
      const [result] = await conn.query("INSERT INTO products SET ?", [data]);
      productId = result.insertId;
      for (let i = 0; i < uploaded.length; i++) {
        await conn.query("INSERT INTO product_images SET ?", [{
          product_id: productId,
          image: uploaded[i].url,
          image_file_id: uploaded[i].fileId,
          is_primary: i === 0 ? 1 : 0,
          sort_order: i + 1,
        }]);
      }
      await conn.commit();
      uploaded = []; // saved: nothing to clean up anymore
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    res.status(201).json(await getProduct(productId));
  } catch (err) {
    console.error(err);
    await Promise.all(uploaded.map((u) => deleteFromImageKit(u.fileId)));
    res.status(500).json({ message: "Failed to create product" });
  }
};

export const updateProduct = async (req, res) => {
  let uploaded = [];
  try {
    const existing = await getProduct(req.params.id);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    const { data, errors, base } = await validate(req.body);
    const files = req.files || [];
    if (existing.images.length + files.length > MAX_IMAGES) {
      errors.images = `Maximum ${MAX_IMAGES} images per product (${existing.images.length} already added)`;
    }
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }

    data.slug = await uniqueSlug(pool, "products", base, existing.id);
    uploaded = await uploadMany(files);

    const hasPrimary = existing.images.some((i) => i.is_primary);
    const maxOrder = Math.max(0, ...existing.images.map((i) => i.sort_order));

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("UPDATE products SET ? WHERE id = ?", [data, existing.id]);
      for (let i = 0; i < uploaded.length; i++) {
        await conn.query("INSERT INTO product_images SET ?", [{
          product_id: existing.id,
          image: uploaded[i].url,
          image_file_id: uploaded[i].fileId,
          is_primary: !hasPrimary && i === 0 ? 1 : 0,
          sort_order: maxOrder + i + 1,
        }]);
      }
      await conn.commit();
      uploaded = [];
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    res.json(await getProduct(existing.id));
  } catch (err) {
    console.error(err);
    await Promise.all(uploaded.map((u) => deleteFromImageKit(u.fileId)));
    res.status(500).json({ message: "Failed to update product" });
  }
};

/* ---------- Toggles & delete ---------- */

// `field` is always a fixed name from this file, never user input
const toggleField = (field) => async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE products SET ${field} = NOT ${field} WHERE id = ?`,
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Product not found" });
    res.json(await getProduct(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update product" });
  }
};

export const toggleProduct = toggleField("is_active");
export const toggleFeatured = toggleField("is_featured");

export const deleteProduct = async (req, res) => {
  try {
    const existing = await getProduct(req.params.id);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    // product_images rows are removed automatically (ON DELETE CASCADE)
    const [files] = await pool.query("SELECT image_file_id FROM product_images WHERE product_id = ?", [existing.id]);
    await pool.query("DELETE FROM products WHERE id = ?", [existing.id]);
    await Promise.all(files.map((f) => deleteFromImageKit(f.image_file_id)));

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

/* ---------- Individual images ---------- */

export const setPrimaryImage = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id FROM product_images WHERE id = ? AND product_id = ?",
      [req.params.imageId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Image not found" });

    // Sets is_primary = 1 for this image and 0 for all others, in one query
    await pool.query("UPDATE product_images SET is_primary = (id = ?) WHERE product_id = ?", [
      req.params.imageId,
      req.params.id,
    ]);
    res.json(await getProduct(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to set cover photo" });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM product_images WHERE id = ? AND product_id = ?",
      [req.params.imageId, req.params.id]
    );
    const img = rows[0];
    if (!img) return res.status(404).json({ message: "Image not found" });

    await pool.query("DELETE FROM product_images WHERE id = ?", [img.id]);

    // If the cover photo was deleted, the next photo becomes the cover
    if (img.is_primary) {
      await pool.query(
        "UPDATE product_images SET is_primary = 1 WHERE product_id = ? ORDER BY sort_order, id LIMIT 1",
        [req.params.id]
      );
    }
    await deleteFromImageKit(img.image_file_id);

    res.json(await getProduct(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete image" });
  }
};