import pool from "../config/db.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageStorage.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

const isHttpsUrl = (v) => {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
};

const extractMapUrl = (v) => {
  if (!v) return null;
  const match = v.match(/src=["']([^"']+)["']/);
  const url = match ? match[1] : v;
  return url.startsWith("https://www.google.com/maps/embed") ? url : undefined;
};

export const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM settings WHERE id = 1");
    res.json(rows[0] || {});
  } catch {
    res.status(500).json({ message: "Failed to load settings" });
  }
};

export const updateSettings = async (req, res) => {
  const b = req.body;
  const data = {
    site_name: clean(b.site_name),
    phone_primary: clean(b.phone_primary),
    phone_secondary: clean(b.phone_secondary),
    email: clean(b.email),
    whatsapp: b.whatsapp ? String(b.whatsapp).replace(/\D/g, "") : null,
    address: clean(b.address),
    facebook: clean(b.facebook),
    instagram: clean(b.instagram),
    linkedin: clean(b.linkedin),
    map_embed: extractMapUrl(clean(b.map_embed)),
  };

  const errors = {};
  if (!data.site_name) errors.site_name = "Company name is required";
  if (!data.phone_primary) errors.phone_primary = "Primary phone is required";
  if (!data.email || !EMAIL_RE.test(data.email)) errors.email = "Enter a valid email address";
  if (!data.whatsapp || data.whatsapp.length < 11 || data.whatsapp.length > 15) {
    errors.whatsapp = "Include the country code, e.g. 919876543210";
  }
  for (const key of ["facebook", "instagram", "linkedin"]) {
    if (data[key] && !isHttpsUrl(data[key])) errors[key] = "Must be a full link starting with https://";
  }
  if (data.map_embed === undefined) errors.map_embed = "Paste the Google Maps embed code or link";

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Please fix the highlighted fields", errors });
  }

  let uploaded;
  try {
    const [[existing]] = await pool.query("SELECT logo_file_id FROM settings WHERE id = 1");
    const removing = b.remove_logo === "true" && !req.file;

    if (req.file) {
      uploaded = await uploadToImageKit(req.file, "brand");
      data.logo = uploaded.url;
      data.logo_file_id = uploaded.fileId;
    } else if (removing) {
      data.logo = null;
      data.logo_file_id = null;
    }

    await pool.query("UPDATE settings SET ? WHERE id = 1", [data]);
    if (uploaded || removing) await deleteFromImageKit(existing?.logo_file_id);

    const [rows] = await pool.query("SELECT * FROM settings WHERE id = 1");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    if (uploaded) await deleteFromImageKit(uploaded.fileId);
    res.status(500).json({ message: "Failed to save settings" });
  }
};