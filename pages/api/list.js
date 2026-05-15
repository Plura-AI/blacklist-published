// GET /api/list
// Returns all published slugs.
// Used by the BAPP plugin for slug collision checking.

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const publishedDir = path.join(process.cwd(), 'published');

  let slugs = [];
  if (fs.existsSync(publishedDir)) {
    slugs = fs
      .readdirSync(publishedDir)
      .filter((f) => f.endsWith('.html') && f !== '.gitkeep')
      .map((f) => ({
        slug: f.replace('.html', ''),
        url: `https://go.blacklistalliance.com/${f.replace('.html', '')}`,
      }));
  }

  return res.status(200).json({ slugs });
}
