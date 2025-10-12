// server/routes/order.js
import { Router } from 'express';
import { sendMail } from '../utils/mailer.js';

const router = Router();

function genOrderCode() {
  return 'SS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

router.post('/', async (req, res) => {
  try {
    const {
      name, phone, email, address,
      method,
      previewFrontUrl, previewBackUrl, userAssetUrl,
      colorHex, designId
    } = req.body || {};

    const orderNo = genOrderCode();

    // trả trước để FE mượt
    res.json({ ok: true, orderNo });

    // ===== Soạn mail =====
    const ts = Date.now();
    const atts = [];

    if (previewFrontUrl) {
      atts.push({
        cid: `${orderNo}-front`,
        filename: `${orderNo}-front-${ts}.jpg`,
        path: previewFrontUrl
      });
    }
    if (previewBackUrl) {
      atts.push({
        cid: `${orderNo}-back`,
        filename: `${orderNo}-back-${ts}.jpg`,
        path: previewBackUrl
      });
    }
    if (userAssetUrl) {
      const ext = (userAssetUrl.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ['jpg','jpeg','png','webp'].includes(ext) ? ext : 'jpg';
      atts.push({
        cid: `${orderNo}-upload`,
        filename: `${orderNo}-upload-${ts}.${safeExt}`,
        path: userAssetUrl
      });
    }

    const esc = (v) => (v == null ? '' : String(v));
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
        <h2 style="margin:0 0 8px">Đơn hàng mới</h2>
        <p><b>Mã đơn:</b> ${orderNo}</p>
        ${designId ? `<p><b>Thiết kế:</b> #${esc(designId)}</p>` : ''}
        <p><b>Khách:</b> ${esc(name)} – ${esc(phone)}</p>
        <p><b>Địa chỉ:</b> ${esc(address)}</p>
        <p><b>Thanh toán:</b> ${esc((method||'').toUpperCase())}</p>
        ${colorHex ? `<p><b>Màu áo:</b> <span style="display:inline-block;width:10px;height:10px;background:${colorHex};border:1px solid #ccc;vertical-align:middle;"></span> ${colorHex}</p>` : ''}

        <table cellpadding="8" cellspacing="0" style="margin-top:8px">
          <tr>
            <td>Front</td>
            <td>${atts.find(a=>a.cid?.endsWith('front')) ? `<img src="cid:${orderNo}-front" width="320" />` : '(không có)'}</td>
          </tr>
          <tr>
            <td>Back</td>
            <td>${atts.find(a=>a.cid?.endsWith('back')) ? `<img src="cid:${orderNo}-back" width="320" />` : '(không có)'}</td>
          </tr>
          <tr>
            <td>Upload</td>
            <td>${atts.find(a=>a.cid?.endsWith('upload')) ? `<img src="cid:${orderNo}-upload" width="320" />` : '(không có)'}</td>
          </tr>
        </table>

        <hr />
        <p>Ảnh được đính kèm ngay trong email. Nguồn ảnh là Supabase Storage (bucket public).</p>
      </div>
    `;

    const factoryTo = process.env.FACTORY_EMAIL;
    const shopFrom  = process.env.SMTP_USER;

    // gửi cho khách (nếu có email)
    if (email) {
      sendMail({ to: email, subject: `Xác nhận đơn hàng - ${orderNo}`, html, attachments: atts })
        .catch(err => console.error('[mail buyer]', err));
    }
    // gửi cho xưởng
    if (factoryTo) {
      sendMail({ to: factoryTo, subject: `[XƯỞNG] Đơn mới - ${orderNo}`, html, attachments: atts })
        .catch(err => console.error('[mail factory]', err));
    } else {
      console.warn('FACTORY_EMAIL is not set. No factory email sent.');
    }
  } catch (e) {
    try { return res.status(500).json({ ok:false, error: 'ORDER_FAILED' }); } catch {}
    console.error('[order]', e);
  }
});

export default router;
