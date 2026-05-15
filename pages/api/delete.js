// DELETE /api/delete
// Body: { slug: string, apiKey: string }
// Removes published/<slug>.html from the repo.

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, apiKey } = req.body;

  // Auth
  const validKey = process.env.BL_PUBLISH_API_KEY;
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (!slug) {
    return res.status(400).json({ error: 'slug is required' });
  }

  const cleanSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Plura-AI';
  const GITHUB_REPO = process.env.GITHUB_REPO || 'blacklist-published';
  const filePath = `published/${cleanSlug}.html`;
  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  // Get SHA (required for deletion)
  const check = await fetch(apiBase, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!check.ok) {
    return res.status(404).json({ error: 'Slug not found' });
  }

  const { sha } = await check.json();

  // Delete the file
  const del = await fetch(apiBase, {
    method: 'DELETE',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Delete ${cleanSlug} via BAPP`,
      sha,
      committer: { name: 'BAPP', email: 'mattd@plura.ai' },
    }),
  });

  if (!del.ok) {
    const err = await del.json();
    return res.status(500).json({ error: 'GitHub delete failed', detail: err });
  }

  return res.status(200).json({ ok: true, slug: cleanSlug, deleted: true });
}
