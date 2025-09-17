// server/src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getPool, sql } from '../db.js';

const router = Router();

// Validators
const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const passOk  = (s) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(s);
const pickUser = (u) => ({ id: u.id, email: u.email, full_name: u.full_name });

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body || {};
    if (!emailOk(email)) return res.status(400).json({ error: 'Email không hợp lệ' });
    if (!passOk(password)) return res.status(400).json({ error: 'Mật khẩu tối thiểu 8 ký tự, có chữ & số' });

    const pool = await getPool();

    const exists = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT TOP 1 id FROM dbo.Users WHERE email=@email');
    if (exists.recordset.length) return res.status(409).json({ error: 'Email đã tồn tại' });

    const hash = await bcrypt.hash(password, 10);

    const inserted = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .input('password_hash', sql.NVarChar(255), hash)
      .input('full_name', sql.NVarChar(120), full_name ?? null)
      .query(`
        INSERT INTO dbo.Users(email, password_hash, full_name)
        OUTPUT inserted.id, inserted.email, inserted.full_name
        VALUES(@email, @password_hash, @full_name)
      `);

    const user = inserted.recordset[0];
    req.session.user = pickUser(user);
    return res.json({ user: req.session.user });
  } catch (e) {
    // 2601/2627: duplicate key
    if (e?.number === 2627 || e?.number === 2601) {
      return res.status(409).json({ error: 'Email đã tồn tại' });
    }
    console.error('register error:', e);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!emailOk(email) || !password) return res.status(400).json({ error: 'Thông tin không hợp lệ' });

    const pool = await getPool();
    const rs = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query('SELECT TOP 1 id, email, password_hash, full_name FROM dbo.Users WHERE email=@email');

    if (!rs.recordset.length) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

    const row = rs.recordset[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

    // update last_login (async, không chặn response)
    pool.request()
      .input('id', sql.Int, row.id)
      .query('UPDATE dbo.Users SET last_login = SYSUTCDATETIME() WHERE id = @id')
      .catch(() => {});

    req.session.user = pickUser(row);
    return res.json({ user: req.session.user });
  } catch (e) {
    console.error('login error:', e);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/me', (req, res) => {
  return res.json({ user: req.session.user || null });
});

router.post('/logout', (req, res) => {
  try {
    req.session.destroy(() => res.json({ ok: true }));
  } catch {
    return res.json({ ok: true });
  }
});

export default router;
