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
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true },
    table: 'sessions',
  }),
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// API routes
app.use('/api/auth', authRoutes);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------- SPA fallback ----------
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  // ✅ Dev fallback bằng RegExp: mọi route KHÔNG bắt đầu bằng /api/
  app.get(/^(?!\/api\/).*/, async (req, res, next) => {
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

  // ✅ Prod fallback bằng RegExp: mọi route KHÔNG bắt đầu bằng /api/
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 5173;
app.listen(port, () => console.log(`Dev server on http://localhost:${port}`));
