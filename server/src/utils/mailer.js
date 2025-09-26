// server/src/utils/mailer.js
import nodemailer from "nodemailer";

export const sendMail = async ({ to, subject, html }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // Gmail STARTTLS => false
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    return transporter.sendMail({
        from: `"StyleSnap 👗" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    });
};
