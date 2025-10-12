// server/src/routes/uploads.js
import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../utils/supabase.js';

const router = Router();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // ≤25MB/ảnh

// POST /api/uploads/sb   (multipart: field "file")
// => { ok, key, publicUrl? , signedUrl? }
router.post('/sb', upload.single('file'), async (req, res) => {
  try {
    // (khuyến nghị) kiểm tra đăng nhập:
    // if (!req.user?.id) return res.status(401).json({ error: 'UNAUTHORIZED' });

    if (!req.file) return res.status(400).json({ error: 'MISSING_FILE' });
    const bucket = process.env.SUPABASE_BUCKET || 'designs';

    const userId = req.user?.id || 'anon';
    const stamp = Date.now();
    const safeName = (req.file.originalname || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `designs/${userId}/${stamp}-${safeName}`;

    // Upload buffer vào Supabase Storage
    const { error: upErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(key, req.file.buffer, { contentType: req.file.mimetype || 'application/octet-stream', upsert: false });

    if (upErr) return res.status(500).json({ error: upErr.message });

    // Lấy URL hiển thị:
    let publicUrl = null, signedUrl = null;

    // Bucket public → public URL
    const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(key);
    publicUrl = pub?.publicUrl || null; // tiện ích ghép URL public (nếu bucket public)

    if (!publicUrl) {
      // Bucket private → cấp signed URL (7 ngày)
      const { data: s, error: sErr } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(key, 60 * 60 * 24 * 7);
      if (sErr) return res.status(500).json({ error: sErr.message });
      signedUrl = s?.signedUrl || null;
    }

    return res.json({ ok: true, key, publicUrl, signedUrl });
  } catch (e) {
    console.error('[uploads/sb]', e);
    return res.status(500).json({ error: 'UPLOAD_FAILED' });
  }
});

export default router;
