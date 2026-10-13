import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// null if not configured: inquiries still save, they just aren't emailed
export const mailer =
  process.env.MAIL_USER && process.env.MAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_APP_PASSWORD },
      })
    : null;