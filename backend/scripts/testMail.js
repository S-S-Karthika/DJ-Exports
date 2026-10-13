import { mailer } from "../config/mailer.js";

if (!mailer) {
  console.log("MAIL_USER or MAIL_APP_PASSWORD is missing in .env");
  process.exit(1);
}

try {
  await mailer.verify();
  console.log("Gmail login OK");
  const info = await mailer.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER,
    subject: "Test from DJ Exports website",
    text: "Email is working.",
  });
  console.log("SENT:", info.messageId);
} catch (err) {
  console.log("MAIL ERROR:", err.message);
}