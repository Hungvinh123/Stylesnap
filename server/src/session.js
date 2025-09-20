// server/src/session.js
import crypto from 'crypto';

const {
  SESSION_SECRET = 'dev-secret-change-me',
  SESSION_DAYS = '7',
} = process.env;

const COOKIE_NAME = 'ssid';

function sign(uid, exp) {
  const h = crypto.createHmac('sha256', SESSION_SECRET);
  h.update(`${uid}.${exp}`);
  return h.digest('base64url');
}

export function createSessionCookie(res, uid) {
  const maxAge = parseInt(SESSION_DAYS, 10) * 24 * 60 * 60 * 1000;
  const exp = Date.now() + maxAge;
  const sig = sign(uid, exp);
  const value = `${uid}.${exp}.${sig}`;
  const isProd = process.env.NODE_ENV === 'production';
  const domain = process.env.SESSION_COOKIE_DOMAIN; // để trống nếu /api cùng domain FE

  res.cookie('ssid', value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge,
    path: '/',
    ...(domain ? { domain } : {}),
  });
}

export function clearSessionCookie(res) {
  res.clearCookie('ssid', { path: '/' });
}

export function verifySessionCookie(req) {
  const raw = req.cookies?.ssid;
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;

  const [uidStr, expStr, sig] = parts;
  const uid = parseInt(uidStr, 10);
  const exp = parseInt(expStr, 10);
  if (!uid || !exp || Date.now() > exp) return null;

  const expect = sign(uid, exp);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  } catch {
    return null;
  }
  return { uid };
}
