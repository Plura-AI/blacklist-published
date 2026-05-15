// GET /api/views
// HTTP Basic Auth via ADMIN_USER / ADMIN_PASS.
// Returns aggregate + per-slug analytics, computed from analytics.json in Vercel Blob.

import { list } from '@vercel/blob';

const ANALYTICS_KEY = 'analytics.json';

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function last7Days() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function checkAuth(req) {
  const expectedUser = (process.env.ADMIN_USER || 'blacklist').trim();
  const expectedPass = (process.env.ADMIN_PASS || 'Blacklist2026!').trim();
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
  const idx = decoded.indexOf(':');
  if (idx < 0) return false;
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  return user === expectedUser && pass === expectedPass;
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkAuth(req)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="BAPP Views"');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
  const data = await readAnalytics(token);
  const today = todayUTC();
  const week = last7Days();

  const slugs = Object.keys(data);
  let totalViews = 0;
  let uniqueVisitors = 0;
  let viewsToday = 0;
  const perSlug = {};

  for (const slug of slugs) {
    const entry = data[slug] || {};
    const total = entry.total || 0;
    const daily = entry.daily || {};
    const unique = Array.isArray(entry.uniqueHashes) ? entry.uniqueHashes.length : 0;
    const todayCount = daily[today] || 0;
    const dailyLast7 = week.map((d) => ({ date: d, count: daily[d] || 0 }));

    totalViews += total;
    uniqueVisitors += unique;
    viewsToday += todayCount;

    perSlug[slug] = {
      total,
      unique,
      today: todayCount,
      daily_last_7: dailyLast7,
    };
  }

  return res.status(200).json({
    total_proposals: slugs.length,
    total_views: totalViews,
    unique_visitors: uniqueVisitors,
    views_today: viewsToday,
    per_slug: perSlug,
  });
}
