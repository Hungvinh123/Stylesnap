// server/src/index.js
import path from 'node:path';
import fs from 'node:fs/promises';
import express from 'express';
import session from 'express-session';
import MSSQLStore from 'connect-mssql-v2';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { getPool } from './db.js';
import authRoutes from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Kết nối DB sớm
await getPool();

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: true, credentials: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'stylesnap_dev_secret',
  resave: false,
  saveUninitialized: false,
  store: new MSSQLStore({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_HOST,      // nên là 'localhost' trong .env
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true },
    table: 'sessions',
  }),
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// API
app.use('/api/auth', authRoutes);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health/db', async (_req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT 1 AS ok');
    res.json({ ok: r.recordset?.[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// -------- FE (Vite + SPA fallback) ----------
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  // ⚠️ Express 5: KHÔNG dùng '*'. Dùng param wildcard '/:path(*)'
  // Bỏ qua mọi route bắt đầu bằng /api/
  app.get('/:path(*)', async (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    try {
      const url = req.originalUrl;
      const html = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf8');
      const transformed = await vite.transformIndexHtml(url, html);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
    } catch (e) {
      vite.ssrFixStacktrace?.(e);
      next(e);
    }
  });
} else {
  // Prod: serve build
  const distDir = path.resolve(__dirname, '../../dist');
  app.use(express.static(distDir));

  // ⚠️ Express 5: fallback hợp lệ
  app.get('/:path(*)', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Global JSON error handler (đặt CUỐI)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 5173;
app.listen(port, () => console.log(`Dev server on http://localhost:${port}`));

