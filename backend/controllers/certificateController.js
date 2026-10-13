import pool from "../config/db.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageStorage.js";

const clean = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const toBool = (v) => v === true || v === "true" || v === "1" || v === 1;

const validate = (b) => {
  const data = {
    title: clean(b.title),
    issuer: clean(b.issuer),
    cert_number: clean(b.cert_number),
    description: clean(b.description),
    is_active: b.is_active === undefined ? 1 : toBool(b.is_active) ? 1 : 0,
  };

  const errors = {};
  if (!data.title) errors.title = "Title is required";
  else if (data.title.length > 150) errors.title = "Maximum 150 characters";
  if (data.issuer && data.issuer.length > 150) errors.issuer = "Maximum 150 characters";
  if (data.cert_number && data.cert_number.length > 100) errors.cert_number = "Maximum 100 characters";
  if (data.description && data.description.length > 1000) errors.description = "Maximum 1000 characters";

  return { data, errors };
};

const getCertificate = async (id) => {
  const [rows] = await pool.query("SELECT * FROM certificates WHERE id = ?", [id]);
  return rows[0];
};

export const listCertificates = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM certificates ORDER BY sort_order, id");
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Failed to load certificates" });
  }
};

export const createCertificate = async (req, res) => {
  const { data, errors } = validate(req.body);
  if (!req.file) errors.image = "Certificate image is required";
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Please fix the highlighted fields", errors });
  }

  let uploaded;
  try {
    uploaded = await uploadToImageKit(req.file, "certificates");
    const [[{ nextOrder }]] = await pool.query(
      "SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextOrder FROM certificates"
    );
    const [result] = await pool.query("INSERT INTO certificates SET ?", [
      { ...data, image: uploaded.url, image_file_id: uploaded.fileId, sort_order: nextOrder },
    ]);
    res.status(201).json(await getCertificate(result.insertId));
  } catch (err) {
    console.error(err);
    if (uploaded) await deleteFromImageKit(uploaded.fileId);
    res.status(500).json({ message: "Failed to create certificate" });
  }
};

export const updateCertificate = async (req, res) => {
  let uploaded;
  try {
    const existing = await getCertificate(req.params.id);
    if (!existing) return res.status(404).json({ message: "Certificate not found" });

    const { data, errors } = validate(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }

    if (req.file) {
      uploaded = await uploadToImageKit(req.file, "certificates");
      data.image = uploaded.url;
      data.image_file_id = uploaded.fileId;
    }

    await pool.query("UPDATE certificates SET ? WHERE id = ?", [data, existing.id]);
    if (uploaded) await deleteFromImageKit(existing.image_file_id);

    res.json(await getCertificate(existing.id));
  } catch (err) {
    console.error(err);
    if (uploaded) await deleteFromImageKit(uploaded.fileId);
    res.status(500).json({ message: "Failed to update certificate" });
  }
};

export const toggleCertificate = async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE certificates SET is_active = NOT is_active WHERE id = ?",
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Certificate not found" });
    res.json(await getCertificate(req.params.id));
  } catch {
    res.status(500).json({ message: "Failed to update certificate" });
  }
};

export const deleteCertificate = async (req, res) => {
  try {
    const existing = await getCertificate(req.params.id);
    if (!existing) return res.status(404).json({ message: "Certificate not found" });

    await pool.query("DELETE FROM certificates WHERE id = ?", [existing.id]);
    await deleteFromImageKit(existing.image_file_id);
    res.json({ message: "Certificate deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete certificate" });
  }
};

export const reorderCertificates = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.every(Number.isInteger)) {
    return res.status(400).json({ message: "Invalid order" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < ids.length; i++) {
      await conn.query("UPDATE certificates SET sort_order = ? WHERE id = ?", [i + 1, ids[i]]);
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