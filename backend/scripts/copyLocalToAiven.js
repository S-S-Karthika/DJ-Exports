import mysql from "mysql2/promise";
import dotenv from "dotenv";
import aiven from "../config/db.js";
dotenv.config();

// Copies every table from your local MySQL into Aiven.
// ⚠ Each Aiven table is EMPTIED first, then filled with the local data.
const TABLES = [
  "settings", "admins", "categories", "products", "product_images", "hero_slides",
  "gallery", "certificates", "testimonials", "about_content", "highlights", "inquiries",
];

// JSON columns come back as objects; they must go back in as text
const toDb = (v) =>
  v !== null && typeof v === "object" && !(v instanceof Date) && !Buffer.isBuffer(v) ? JSON.stringify(v) : v;

const local = await mysql.createConnection({
  host: process.env.LOCAL_DB_HOST || "localhost",
  port: Number(process.env.LOCAL_DB_PORT) || 3306,
  user: process.env.LOCAL_DB_USER || "root",
  password: process.env.LOCAL_DB_PASSWORD,
  database: process.env.LOCAL_DB_NAME || "export_db",
});
const target = await aiven.getConnection();

try {
  // Lets tables be filled in any order without foreign key errors
  await target.query("SET FOREIGN_KEY_CHECKS = 0");

  for (const table of TABLES) {
    let rows;
    try {
      [rows] = await local.query(`SELECT * FROM \`${table}\``);
    } catch {
      console.log(`- ${table}: not in local database, skipped`);
      continue;
    }

    // Only copy columns that exist in the Aiven table
    const [targetCols] = await target.query(`SHOW COLUMNS FROM \`${table}\``);
    const allowed = new Set(targetCols.map((c) => c.Field));

    await target.query(`DELETE FROM \`${table}\``);

    if (!rows.length) {
      console.log(`- ${table}: empty`);
      continue;
    }

    const cols = Object.keys(rows[0]).filter((c) => allowed.has(c));
    const values = rows.map((r) => cols.map((c) => toDb(r[c])));
    await target.query(
      `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES ?`,
      [values]
    );
    console.log(`✓ ${table}: ${rows.length} row(s) copied`);
  }

  console.log("\nDone. Your local data is now in Aiven.");
} catch (err) {
  console.error("\nCOPY FAILED:", err.message);
} finally {
  await target.query("SET FOREIGN_KEY_CHECKS = 1");
  target.release();
  await local.end();
  await aiven.end();
}