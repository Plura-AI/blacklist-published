// POST /api/admin-login
// Body: { password: string }
// Sets a short-lived HttpOnly cookie that the /admin middleware will accept.

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const expectedPass = (process.env.ADMIN_PASS || 'Blacklist2026!').trim();

  if (!password || password !== expectedPass) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const cookie = [
    `bapp_admin=${encodeURIComponent(expectedPass)}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/admin',
    'Max-Age=86400',
  ].join('; ');

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
}
