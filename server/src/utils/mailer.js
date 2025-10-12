// server/utils/mailer.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

export function sendMail({ to, subject, html, text, attachments }) {
  return transporter.sendMail({
    from: `"Stylesnap" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
    attachments, // có thể là mảng { filename, path, cid }
  });
}
