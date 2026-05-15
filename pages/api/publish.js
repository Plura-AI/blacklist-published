// POST /api/publish
// Body: { slug: string, html: string, apiKey: string }
// Commits the HTML to published/<slug>.html in this repo.
// Vercel auto-deploys on push, making the page live at go.blacklistalliance.com/<slug>

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, html, apiKey } = req.body;

  // Auth — trim in case env var was set with a trailing newline
  const validKey = (process.env.BL_PUBLISH_API_KEY || '').trim();
  if (!apiKey || apiKey.trim() !== validKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Validate
  if (!slug || !html) {
    return res.status(400).json({ error: 'slug and html are required' });
  }

  // Sanitize slug — lowercase, alphanumeric + hyphens only
  const cleanSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!cleanSlug) {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Plura-AI';
  const GITHUB_REPO = process.env.GITHUB_REPO || 'blacklist-published';
  const filePath = `published/${cleanSlug}.html`;
  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  // Check if file already exists (need SHA to update)
  let sha = null;
  try {
    const check = await fetch(apiBase, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (check.ok) {
      const data = await check.json();
      sha = data.sha;
    }
  } catch (_) {
    // File doesn't exist — that's fine
  }

  // Commit the file to GitHub
  const body = {
    message: sha
      ? `Update ${cleanSlug} via BAPP`
      : `Publish ${cleanSlug} via BAPP`,
    content: Buffer.from(html).toString('base64'),
    committer: { name: 'BAPP', email: 'mattd@plura.ai' },
  };
  if (sha) body.sha = sha;

  const commit = await fetch(apiBase, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!commit.ok) {
    const err = await commit.json();
    return res.status(500).json({ error: 'GitHub commit failed', detail: err });
  }

  const liveUrl = `https://go.blacklistalliance.com/${cleanSlug}`;
  return res.status(200).json({
    ok: true,
    slug: cleanSlug,
    url: liveUrl,
    updated: !!sha,
    message: sha
      ? `Updated. Live at ${liveUrl} (rebuilding — ~30 sec)`
      : `Published. Live at ${liveUrl} (building — ~30 sec)`,
  });
}
