import express from "express";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, address, phone, preview } = req.body;

    const html = `
      <h2>Đơn hàng mới từ ${name}</h2>
      <p><b>Địa chỉ:</b> ${address}</p>
      <p><b>Số điện thoại:</b> ${phone}</p>
      <p>Cảm ơn bạn đã đặt hàng tại <b>StyleSnap</b>!</p>
      ${preview ? `<p><b>Ảnh preview 3D:</b></p><img src="${preview}" style="max-width:300px"/>` : ""}
    `;

    await sendMail({
      to: email || process.env.SMTP_USER, // nếu không nhập email thì gửi về admin
      subject: "Xác nhận đơn hàng - StyleSnap",
      html,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Send mail error:", err);
    res.status(500).json({ ok: false, error: "Gửi email thất bại" });
  }
});

export default router;
