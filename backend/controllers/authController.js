import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [rows] = await pool.query("SELECT * FROM admins WHERE email = ?", [email]);
    const admin = rows[0];

    // Same message for wrong email and wrong password, so attackers can't tell which emails exist
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email FROM admins WHERE id = ?", [req.admin.id]);
    if (!rows[0]) return res.status(404).json({ message: "Admin not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const updateProfile = async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

  const errors = {};
  if (!name) errors.name = "Name is required";
  else if (name.length > 100) errors.name = "Maximum 100 characters";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Please fix the highlighted fields", errors });
  }

  try {
    const [dup] = await pool.query("SELECT id FROM admins WHERE email = ? AND id <> ?", [email, req.admin.id]);
    if (dup.length) {
      return res.status(400).json({ message: "Email already in use", errors: { email: "Another admin uses this email" } });
    }
    await pool.query("UPDATE admins SET name = ?, email = ? WHERE id = ?", [name, email, req.admin.id]);
    const [rows] = await pool.query("SELECT id, name, email FROM admins WHERE id = ?", [req.admin.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  const errors = {};
  if (!current_password) errors.current_password = "Enter your current password";
  if (typeof new_password !== "string" || new_password.length < 10) {
    errors.new_password = "Use at least 10 characters";
  } else if (new_password === current_password) {
    errors.new_password = "Choose a password different from the current one";
  }
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: "Please fix the highlighted fields", errors });
  }

  try {
    const [rows] = await pool.query("SELECT password FROM admins WHERE id = ?", [req.admin.id]);
    const ok = rows[0] && (await bcrypt.compare(current_password, rows[0].password));
    // 400, not 401: a 401 would make the frontend log the admin out
    if (!ok) {
      return res.status(400).json({
        message: "Current password is incorrect",
        errors: { current_password: "Current password is incorrect" },
      });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE admins SET password = ? WHERE id = ?", [hash, req.admin.id]);
    res.json({ message: "Password changed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to change password" });
  }
};