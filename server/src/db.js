// server/src/db.js
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ưu tiên .env ở ROOT, fallback server/.env (không override biến đã nạp)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });

const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const config = {
  server: process.env.DB_HOST || 'localhost',
  port: toInt(process.env.DB_PORT, 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'stylesnap',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

function assertConfig() {
  const missing = [];
  if (!config.server || typeof config.server !== 'string') missing.push('DB_HOST');
  if (!config.user) missing.push('DB_USER');
  if (!config.password) missing.push('DB_PASS');
  if (!config.database) missing.push('DB_NAME');
  if (missing.length) {
    const example = [
      'DB_HOST=localhost',
      'DB_PORT=1433',
      'DB_NAME=stylesnap',
      'DB_USER=sa',
      'DB_PASS=12345678',
      '# DB_INSTANCE=SQLEXPRESS  (optional)',
      'SESSION_SECRET=change_this_secret',
    ].join('\n');
    throw new Error(`Missing database ENV: ${missing.join(', ')}\nPlease create .env in project root. Example:\n${example}`);
  }
}
assertConfig();

let pool;
export async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}
export { sql, config };
