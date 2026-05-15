// POST /api/hit
// Body: { slug: string }
// Lightweight analytics — increments total/daily counts and tracks unique visitors
// (hashed) for a slug. Backed by a single analytics.json blob in Vercel Blob.

import crypto from 'crypto';
import { put, list } from '@vercel/blob';

const ANALYTICS_KEY = 'analytics.json';
const UNIQUE_CAP = 50000;
const SLUG_RE = /^[a-z0-9-]+$/;

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
}

async function readAnalytics(token) {
  try {
    const { blobs } = await list({ prefix: ANALYTICS_KEY, limit: 1, token });
    const match = blobs.find((b) => b.pathname === ANALYTICS_KEY);
    if (!match) return {};
    const r = await fetch(match.url, { cache: 'no-store' });
    if (!r.ok) return {};
    return await r.json();
  } catch (_) {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
  const salt = (process.env.ANALYTICS_SALT || 'bapp-default-salt').trim();

  try {
    const body = req.body || {};
    const slug = typeof body.slug === 'string' ? body.slug : '';
    if (!SLUG_RE.test(slug)) {
      return res.status(200).json({ ok: true });
    }

    const day = todayUTC();
    const ip = clientIp(req);
    const ua = req.headers['user-agent'] || '';
    const hash = crypto
      .createHash('sha256')
      .update(`${ip}|${ua}|${slug}|${day}|${salt}`)
      .digest('hex');

    const data = await readAnalytics(token);
    const entry = data[slug] || { total: 0, daily: {}, uniqueHashes: [] };

    entry.total = (entry.total || 0) + 1;
    entry.daily = entry.daily || {};
    entry.daily[day] = (entry.daily[day] || 0) + 1;
    entry.uniqueHashes = entry.uniqueHashes || [];

    if (!entry.uniqueHashes.includes(hash)) {
      entry.uniqueHashes.push(hash);
      if (entry.uniqueHashes.length > UNIQUE_CAP) {
        entry.uniqueHashes.splice(0, entry.uniqueHashes.length - UNIQUE_CAP);
      }
    }

    data[slug] = entry;

    await put(ANALYTICS_KEY, JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      token,
    });

    return res.status(200).json({ ok: true });
  } catch (_) {
    return res.status(200).json({ ok: true });
  }
}
