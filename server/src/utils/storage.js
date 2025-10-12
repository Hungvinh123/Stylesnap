// server/utils/storage.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'public/uploads');
const ASSET_BASE_URL = (process.env.ASSET_BASE_URL || '').replace(/\/$/, '');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function saveBuffer(buf, relKey) {
  const abs = path.join(UPLOAD_DIR, relKey);
  ensureDir(path.dirname(abs));
  fs.writeFileSync(abs, buf);
  return `${ASSET_BASE_URL}/${relKey.replace(/\\/g, '/')}`;
}

export function saveDataUrl(dataUrl, relKey) {
  const m = /^data:(.+);base64,(.+)$/i.exec(dataUrl || '');
  if (!m) throw new Error('INVALID_DATA_URL');
  const buf = Buffer.from(m[2], 'base64');
  return saveBuffer(buf, relKey);
}
