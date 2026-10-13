import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const [, , name, email, password] = process.argv;

if (!name || !email || !password) {
  console.log('Usage: node scripts/createAdmin.js "Name" email@example.com password');
  process.exit(1);
}
if (password.length < 8) {
  console.log("Password must be at least 8 characters");
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 10);
  await pool.query("INSERT INTO admins (name, email, password) VALUES (?, ?, ?)", [name, email, hash]);
  console.log(`Admin created: ${email}`);
} catch (err) {
  console.log(err.code === "ER_DUP_ENTRY" ? "Admin with this email already exists" : err.message);
} finally {
  await pool.end();
}