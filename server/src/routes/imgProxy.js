// server/src/routes/imgProxy.js
import { Router } from 'express';

const router = Router();

// GET /api/img?url=https://example.com/a.png
router.get('/', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('Missing url');

    // Dùng fetch built-in (Node 18+)
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).send('Upstream error');

    // Header để canvas không bị tainted và cho caching
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400');

    const ct = r.headers.get('content-type') || 'application/octet-stream';
    res.set('Content-Type', ct);

    // Chuyển WebStream -> Buffer rồi trả về (đơn giản, ổn định)
    const ab = await r.arrayBuffer();
    res.send(Buffer.from(ab));
  } catch (e) {
    console.error('[imgProxy]', e);
    res.status(500).send('Proxy failed');
  }
});

export default router;
