import pool from "../config/db.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageStorage.js";

export const ABOUT_IMAGE_FIELDS = [
  "banner_image",
  "story_image_main",
  "story_image_secondary",
  "founder_image",
  "karur_image",
];

const TEXT_LIMITS = {
  story_title: 200,
  highlight: 200,
  story_text: 5000,
  founder_name: 100,
  founder_title: 100,
  founder_message: 1500,
  mission: 1000,
  vision: 1000,
  karur_title: 200,
  karur_text: 3000,
};

const clean = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

const getRow = async () => {
  const [rows] = await pool.query("SELECT * FROM about_content WHERE id = 1");
  return rows[0];
};

export const getAbout = async (req, res) => {
  try {
    res.json((await getRow()) || {});
  } catch {
    res.status(500).json({ message: "Failed to load About content" });
  }
};

export const updateAbout = async (req, res) => {
  const data = {};
  const errors = {};

  for (const [field, max] of Object.entries(TEXT_LIMITS)) {
    const value = clean(req.body[field]);
    if (value && value.length > max) errors[field] = `Maximum ${max} characters`;
    data[field] = value;
  }
  if (!data.story_text) errors.story_text = "Your story is required";
  if (data.founder_message && !data.founder_name) {
    errors.founder_name = "Add the founder's name, or the message won't be shown";
  }
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Please fix the highlighted fields", errors });
  }

  const uploaded = []; // new images, so we can clean up if something fails
  try {
    const existing = await getRow();
    if (!existing) {
      return res.status(404).json({ message: "About content not found. Run the setup SQL." });
    }

    // Upload all new images at the same time
    const toUpload = ABOUT_IMAGE_FIELDS.filter((f) => req.files?.[f]?.[0]);
    const settled = await Promise.allSettled(
      toUpload.map((f) =>
        uploadToImageKit(req.files[f][0], "about").then((r) => ({ field: f, ...r }))
      )
    );
    settled.forEach((s) => s.status === "fulfilled" && uploaded.push(s.value));
    if (settled.some((s) => s.status === "rejected")) throw new Error("Image upload failed");

    const oldFileIds = [];

    for (const u of uploaded) {
      data[u.field] = u.url;
      data[`${u.field}_file_id`] = u.fileId;
      oldFileIds.push(existing[`${u.field}_file_id`]);
    }

    // Images the admin chose to remove
    for (const f of ABOUT_IMAGE_FIELDS) {
      if (req.body[`remove_${f}`] === "true" && !uploaded.some((u) => u.field === f)) {
        data[f] = null;
        data[`${f}_file_id`] = null;
        oldFileIds.push(existing[`${f}_file_id`]);
      }
    }

    await pool.query("UPDATE about_content SET ? WHERE id = 1", [data]);

    // Old files are deleted only after the database update succeeded
    await Promise.all(oldFileIds.map(deleteFromImageKit));

    res.json(await getRow());
  } catch (err) {
    console.error(err);
    await Promise.all(uploaded.map((u) => deleteFromImageKit(u.fileId)));
    res.status(500).json({ message: "Failed to save About page" });
  }
};