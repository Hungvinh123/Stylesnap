// server/src/routes/designs.js
import { Router } from 'express';
import sql from 'mssql';
import { getPool } from '../db.js';

const router = Router();

// [Tùy] GET danh sách mẫu theo user
router.get('/:userId', async (req, res) => {
  try {
    const pool = await getPool();
    const userId = Number(req.params.userId);
    const rs = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT d.id, d.title, d.color_hex AS colorHex,
               d.preview_front_url AS previewFrontUrl,
               d.preview_back_url AS previewBackUrl,
               d.created_at
        FROM dbo.Designs d
        WHERE d.user_id=@userId
        ORDER BY d.id DESC
      `);
    res.json({ ok: true, rows: rs.recordset });
  } catch (e) {
    console.error('[designs/:userId]', e);
    res.status(500).json({ error: 'LIST_FAILED' });
  }
});

// NEW: Lưu thiết kế bằng URL đã upload sẵn (Supabase)
router.post('/save-min-urls', async (req, res) => {
  try {
    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { title, colorHex, frontUrl, backUrl, assets = [] } = req.body || {};
    if (!frontUrl && !backUrl) return res.status(400).json({ error: 'MISSING_IMAGES' });

    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();

    const ins = await new sql.Request(tx)
      .input('userId', sql.Int, user.id)
      .input('title',  sql.NVarChar, title || 'Thiết kế')
      .input('color',  sql.NVarChar, colorHex || null)
      .input('front',  sql.NVarChar, frontUrl || null)
      .input('back',   sql.NVarChar, backUrl || null)
      .query(`
        INSERT INTO dbo.Designs(user_id, title, color_hex, preview_front_url, preview_back_url)
        OUTPUT inserted.id AS id
        VALUES(@userId, @title, @color, @front, @back)
      `);
    const designId = ins.recordset[0].id;

    for (const a of assets) {
      if (!a?.url) continue;
      const kind = a.kind || 'misc';
      const filename = (a.filename || `${kind}.jpg`).replace(/^\/+/, '');
      await new sql.Request(tx)
        .input('designId', sql.Int, designId)
        .input('kind',     sql.NVarChar, kind)
        .input('filename', sql.NVarChar, filename)
        .input('url',      sql.NVarChar, a.url)
        .query(`INSERT INTO dbo.DesignAssets(design_id, kind, filename, url)
                VALUES(@designId, @kind, @filename, @url)`);
    }

    await tx.commit();
    return res.json({ ok: true, designId, previewFrontUrl: frontUrl || null, previewBackUrl: backUrl || null });
  } catch (e) {
    console.error('[designs/save-min-urls]', e);
    return res.status(500).json({ error: 'SAVE_MIN_URLS_FAILED' });
  }
});

export default router;
