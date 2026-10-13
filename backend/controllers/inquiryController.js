import pool from "../config/db.js";
import { mailer } from "../config/mailer.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCES = ["quote_modal", "contact_page", "product_page"];
const STATUSES = ["new", "contacted", "closed"];
const LIMITS = {
  full_name: 100, email: 150, phone: 30, company: 150,
  country: 100, quantity: 100, message: 3000,
};

const clean = (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

// Escape user text before putting it into an HTML email
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const notifyOwner = async (inq, categoryName, id) => {
  if (!mailer) {
    console.warn(`Inquiry #${id} saved, but email is not configured`);
    return;
  }
  const [[s]] = await pool.query("SELECT site_name, email FROM settings WHERE id = 1");
  const to = s?.email || process.env.MAIL_USER;

  const rows = [
    ["Name", inq.full_name],
    ["Email", inq.email],
    ["Phone", inq.phone],
    ["Company", inq.company],
    ["Country", inq.country],
    ["Product category", categoryName],
    ["Quantity", inq.quantity],
    ["Message", inq.message],
    ["Sent from", inq.source.replace("_", " ")],
  ].filter(([, v]) => v);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#1c3f17;margin-bottom:16px">New inquiry #${id}</h2>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:10px;border:1px solid #e5e0d8;background:#f6f2ec;font-weight:bold;width:150px;vertical-align:top">${k}</td><td style="padding:10px;border:1px solid #e5e0d8;white-space:pre-wrap">${esc(v)}</td></tr>`
          )
          .join("")}
      </table>
      <p style="color:#777;font-size:13px;margin-top:16px">Reply to this email to respond directly to the buyer.</p>
    </div>`;

  await mailer.sendMail({
    from: `"${s?.site_name || "Website"}" <${process.env.MAIL_USER}>`,
    to,
    replyTo: inq.email,
    subject: `New inquiry: ${inq.full_name}${inq.country ? ` (${inq.country})` : ""}`,
    html,
    text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
  });
};

/* ---------- Public: submit an inquiry ---------- */

export const createInquiry = async (req, res) => {
  const b = req.body;

  // Honeypot: humans never see this field, bots fill it in. Pretend success.
  if (b.website) return res.status(201).json({ message: "Inquiry received" });

  const data = {};
  const errors = {};
  for (const [field, max] of Object.entries(LIMITS)) {
    const v = clean(b[field]);
    if (v && v.length > max) errors[field] = `Maximum ${max} characters`;
    data[field] = v;
  }
  if (!data.full_name) errors.full_name = "Please enter your name";
  if (!data.email || !EMAIL_RE.test(data.email)) errors.email = "Please enter a valid email";
  if (!data.phone || data.phone.replace(/\D/g, "").length < 7) errors.phone = "Please enter a valid phone number";
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Please check the highlighted fields", errors });
  }

  data.source = SOURCES.includes(b.source) ? b.source : "contact_page";
    data.channel = ["whatsapp", "email"].includes(b.channel) ? b.channel : null;
  data.category_id = null;

  try {
    let categoryName = null;
    const catId = Number(b.category_id);
    if (Number.isInteger(catId) && catId > 0) {
      const [rows] = await pool.query("SELECT id, name FROM categories WHERE id = ? AND is_active = 1", [catId]);
      if (rows[0]) {
        data.category_id = rows[0].id;
        categoryName = rows[0].name;
      }
    }

        const prodId = Number(b.product_id);
    if (Number.isInteger(prodId) && prodId > 0) {
      const [prows] = await pool.query(
        "SELECT id, category_id FROM products WHERE id = ? AND is_active = 1",
        [prodId]
      );
      if (prows[0]) {
        data.product_id = prows[0].id;
        if (!data.category_id) data.category_id = prows[0].category_id;
      }
    }

    const [result] = await pool.query("INSERT INTO inquiries SET ?", [data]);

    // Respond immediately; the email is sent in the background
    res.status(201).json({ message: "Inquiry received", id: result.insertId });

    notifyOwner(data, categoryName, result.insertId).catch((err) =>
      console.error(`Inquiry #${result.insertId} email failed:`, err.message)
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong. Please contact us on WhatsApp or email instead." });
  }
};

/* ---------- Admin ---------- */

const INQUIRY_SELECT = `
  SELECT i.*, c.name AS category_name,
         pr.name AS product_name, pr.slug AS product_slug, pc.slug AS product_category_slug
  FROM inquiries i
  LEFT JOIN categories c ON c.id = i.category_id
  LEFT JOIN products pr ON pr.id = i.product_id
  LEFT JOIN categories pc ON pc.id = pr.category_id`;

const getInquiry = async (id) => {
  const [rows] = await pool.query(`${INQUIRY_SELECT} WHERE i.id = ?`, [id]);
  return rows[0];
};

export const listInquiries = async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = [];
    const params = [];
    if (STATUSES.includes(status)) {
      where.push("i.status = ?");
      params.push(status);
    }
    if (q) {
      where.push("(i.full_name LIKE ? OR i.email LIKE ? OR i.phone LIKE ? OR i.company LIKE ? OR i.country LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like, like, like);
    }

    const [items] = await pool.query(
      `${INQUIRY_SELECT}
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY i.created_at DESC
       LIMIT 500`,
      params
    );
    const [counts] = await pool.query("SELECT status, COUNT(*) AS total FROM inquiries GROUP BY status");

    res.json({ items, counts: Object.fromEntries(counts.map((c) => [c.status, c.total])) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load inquiries" });
  }
};

export const updateInquiryStatus = async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status" });
  try {
    const [result] = await pool.query("UPDATE inquiries SET status = ? WHERE id = ?", [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Inquiry not found" });
    res.json(await getInquiry(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update inquiry" });
  }
};

export const updateInquiryNote = async (req, res) => {
  const note = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 2000) : "";
  try {
    const [result] = await pool.query("UPDATE inquiries SET admin_note = ? WHERE id = ?", [
      note || null,
      req.params.id,
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: "Inquiry not found" });
    res.json(await getInquiry(req.params.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save note" });
  }
};

export const deleteInquiry = async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM inquiries WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Inquiry not found" });
    res.json({ message: "Inquiry deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete inquiry" });
  }
};
