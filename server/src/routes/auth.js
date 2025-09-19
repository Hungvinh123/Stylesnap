// server/src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getPool, sql } from '../db.js';

function assertGoogleEnv() {
  const miss = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'];
  const lack = miss.filter(k => !process.env[k]);
  if (lack.length) throw new Error('Missing Google OAuth ENV: ' + lack.join(', '));
}
assertGoogleEnv();


const router = Router();

// ===== Validators / helpers (giữ y nguyên như bạn đang có) =====
const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const passOk  = (s) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(s);
const pickUser = (u) => ({ id: u.id, email: u.email, full_name: u.full_name });
const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//')) ? n : '/home';

// ===== Register (giữ nguyên) =====
router.post('/register', /* ... y nguyên code hiện có ... */ async (req, res) => {
  try {
    const { email, password, full_name } = req.body || {};
    if (!emailOk(email)) return res.status(400).json({ error: 'Email không hợp lệ' });
    if (!passOk(password)) return res.status(400).json({ error: 'Mật khẩu tối thiểu 8 ký tự, có chữ & số' });
    const pool = await getPool();
    const exists = await pool.request().input('email', sql.NVarChar(255), email)
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
    if (e?.number === 2627 || e?.number === 2601) return res.status(409).json({ error: 'Email đã tồn tại' });
    console.error('register error:', e);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

// ===== Login (giữ nguyên) =====
router.post('/login', /* ... y nguyên code hiện có ... */ async (req, res) => {
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
    pool.request().input('id', sql.Int, row.id)
      .query('UPDATE dbo.Users SET last_login = SYSUTCDATETIME() WHERE id = @id')
      .catch(() => {});
    req.session.user = pickUser(row);
    return res.json({ user: req.session.user });
  } catch (e) {
    console.error('login error:', e);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});

// ===== Me / Logout (giữ nguyên) =====
router.get('/me', (req, res) => res.json({ user: req.session.user || null }));
router.post('/logout', (req, res) => {
  try { req.session.destroy(() => res.json({ ok: true })); }
  catch { return res.json({ ok: true }); }
});

/* ================== GOOGLE (REDIRECT-BASED) ================== */

// B1: start – nhận ?next, lưu vào session, rồi chuyển hướng tới Google
router.get('/google/start', (req, res) => {
  const next = safeNext(req.query.next);
  req.session.postLoginRedirect = next;   // nhớ ý định điều hướng

  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'select_account'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`);
});

// B2: callback – đổi code -> token, tạo/ghép user, rồi redirect về next (mặc định /home)
router.get('/google/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query || {};
    if (error) {
      console.error('Google OAuth error:', error, error_description);
      return res.redirect('/login?oauth=google_error');
    }
    if (!code) return res.redirect('/login?oauth=missing_code');

    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code'
    });

    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!tokenResp.ok) {
      const msg = await tokenResp.text().catch(() => '');
      console.error('Token exchange failed:', tokenResp.status, msg);
      return res.redirect('/login?oauth=token_exchange_failed');
    }

    const tokenJson = await tokenResp.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) return res.redirect('/login?oauth=no_access_token');

    const ui = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!ui.ok) {
      const msg = await ui.text().catch(() => '');
      console.error('Userinfo failed:', ui.status, msg);
      return res.redirect('/login?oauth=userinfo_failed');
    }
    const info = await ui.json(); // { sub, email, name, ... }

    // Upsert & tạo session (y hệt trước đây)
    const pool = await getPool();
    const provider = 'google';
    const pid = info.sub;
    const email = info.email || null;
    const full_name = info.name || null;

    const linked = await pool.request()
      .input('provider', sql.NVarChar(50), provider)
      .input('pid', sql.NVarChar(255), pid)
      .query(`
        SELECT u.id, u.email, u.full_name
        FROM dbo.UserAuthProviders ap
        JOIN dbo.Users u ON u.id = ap.user_id
        WHERE ap.provider=@provider AND ap.provider_user_id=@pid
      `);

    let userRow;
    if (linked.recordset.length) {
      userRow = linked.recordset[0];
    } else {
      let userId = null;
      if (email) {
        const findUser = await pool.request()
          .input('email', sql.NVarChar(255), email)
          .query('SELECT id FROM dbo.Users WHERE email=@email');
        if (findUser.recordset.length) userId = findUser.recordset[0].id;
      }
      if (!userId) {
        const ins = await pool.request()
          .input('email', sql.NVarChar(255), email || `${pid}@google.local`)
          .input('password_hash', sql.NVarChar(255), 'oauth')
          .input('full_name', sql.NVarChar(120), full_name)
          .query(`
            INSERT INTO dbo.Users (email, password_hash, full_name)
            OUTPUT inserted.id, inserted.email, inserted.full_name
            VALUES (@email, @password_hash, @full_name)
          `);
        userRow = ins.recordset[0];
        userId = userRow.id;
      }
      if (!userRow) {
        const getUser = await pool.request()
          .input('id', sql.Int, userId)
          .query('SELECT id, email, full_name FROM dbo.Users WHERE id=@id');
        userRow = getUser.recordset[0];
      }

      await pool.request()
        .input('user_id', sql.Int, userRow.id)
        .input('provider', sql.NVarChar(50), provider)
        .input('pid', sql.NVarChar(255), pid)
        .query(`
          IF NOT EXISTS (
            SELECT 1 FROM dbo.UserAuthProviders WHERE user_id=@user_id AND provider=@provider AND provider_user_id=@pid
          )
          INSERT INTO dbo.UserAuthProviders (user_id, provider, provider_user_id)
          VALUES (@user_id, @provider, @pid)
        `);
    }

    req.session.user = pickUser(userRow);

    // ✅ Lấy next từ session (nếu không có thì về /home)
    const next = safeNext(req.session.postLoginRedirect);
    delete req.session.postLoginRedirect;

    return res.redirect(next);
  } catch (e) {
    console.error('google/callback error:', e);
    return res.redirect('/login?oauth=server_error');
  }
});

export default router;
