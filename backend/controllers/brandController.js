import pool from "../config/db.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageStorage.js";

export const getLogo = async (req, res) => {
  try {
    const [[row]] = await pool.query("SELECT site_name, logo FROM settings WHERE id = 1");
    res.json(row || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load logo" });
  }
};

export const uploadLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Choose a logo image", errors: { logo: "Choose a logo image" } });
  }
  let uploaded;
  try {
    const [[existing]] = await pool.query("SELECT logo_file_id FROM settings WHERE id = 1");
    uploaded = await uploadToImageKit(req.file, "brand");
    await pool.query("UPDATE settings SET logo = ?, logo_file_id = ? WHERE id = 1", [uploaded.url, uploaded.fileId]);
    await deleteFromImageKit(existing?.logo_file_id); // remove the old logo only after saving the new one
    res.json({ logo: uploaded.url });
  } catch (err) {
    console.error(err);
    if (uploaded) await deleteFromImageKit(uploaded.fileId);
    res.status(500).json({ message: "Failed to upload logo" });
  }
};

export const removeLogo = async (req, res) => {
  try {
    const [[existing]] = await pool.query("SELECT logo_file_id FROM settings WHERE id = 1");
    await pool.query("UPDATE settings SET logo = NULL, logo_file_id = NULL WHERE id = 1");
    await deleteFromImageKit(existing?.logo_file_id);
    res.json({ logo: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove logo" });
  }
};