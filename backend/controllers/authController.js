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