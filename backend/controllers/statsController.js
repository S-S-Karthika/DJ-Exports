import pool from "../config/db.js";

export const getStats = async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM products WHERE is_active = 1) AS products_live,
        (SELECT COUNT(*) FROM categories) AS categories,
        (SELECT COUNT(*) FROM hero_slides WHERE is_active = 1) AS banners,
        (SELECT COUNT(*) FROM inquiries) AS inquiries_total,
        (SELECT COUNT(*) FROM inquiries WHERE status = 'new') AS new_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE created_at >= NOW() - INTERVAL 7 DAY) AS inquiries_week
    `);
    const [recent] = await pool.query(
      `SELECT id, full_name, company, country, status, created_at
       FROM inquiries ORDER BY created_at DESC LIMIT 5`
    );
    res.json({ ...stats, recent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load stats" });
  }
};