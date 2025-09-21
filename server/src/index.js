// server/src/index.js
import path from 'node:path';
import fs from 'node:fs/promises';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { getPool } from './db.js';
import authRoutes from './routes/auth.js';
import downloadRoutes from './routes/download.js';
import designRoutes from './routes/designs.js';
import paymentRoutes from './routes/payment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Mở kết nối DB (không chặn server nếu fail)
getPool().catch(err => {
  console.warn('[DB] connect failed (server vẫn chạy):', err?.message || err);
});

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log(`[BOOT] NODE_ENV = ${NODE_ENV}`);

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

// API
app.use('/api/auth', authRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/payment', paymentRoutes);
// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --------- SPA (Dev: Vite middleware / Prod: static dist) ----------
if (NODE_ENV !== 'production') {
  console.log('[WEB] Using Vite middleware (dev)');
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  app.get(/^(?!\/api\/).*/, async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const htmlPath = path.resolve(process.cwd(), 'index.html');
      const rawHtml = await fs.readFile(htmlPath, 'utf8');
      const transformed = await vite.transformIndexHtml(url, rawHtml);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
    } catch (e) {
      vite.ssrFixStacktrace?.(e);
      next(e);
    }
  });
} else {
  console.log('[WEB] Serving dist/ (prod)');
  const distDir = path.resolve(__dirname, '../../dist');
  app.use(express.static(distDir));
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[BOOT] Server running at http://localhost:${port}`);
  console.log(`[WEB] Visit http://localhost:${port} (dev mode should HMR with Vite)`);
});
