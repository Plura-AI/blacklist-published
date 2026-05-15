// POST /api/publish
// Body: { slug: string, html: string, apiKey: string }
// Commits the HTML to published/<slug>.html in this repo.
// Vercel auto-deploys on push, making the page live at go.blacklistalliance.com/<slug>

const GATE_SNIPPET = `
<style id="bapp-doc-gate-style">
  body.bapp-gated > *:not(#bapp-doc-gate) { visibility: hidden; }
  #bapp-doc-gate {
    position: fixed; inset: 0; z-index: 2147483647;
    background: #F7F7F7;
    font-family: "General Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  #bapp-doc-gate * { box-sizing: border-box; border-radius: 0 !important; }
  #bapp-doc-gate .card { background: #FFFFFF; border: 1px solid #E0E0E0; padding: 48px 40px; max-width: 420px; width: 100%; }
  #bapp-doc-gate .bar { display: block; width: 56px; height: 4px; background: #A50100; margin-bottom: 20px; }
  #bapp-doc-gate h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 10px; color: #000; }
  #bapp-doc-gate .sub { font-size: 14px; color: #525252; margin: 0 0 28px; line-height: 1.55; }
  #bapp-doc-gate label { display:block; font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #525252; margin-bottom: 8px; }
  #bapp-doc-gate input { width: 100%; height: 48px; padding: 0 16px; background: #FFFFFF; color: #000; font-family: inherit; font-size: 15px; border: 1px solid #E0E0E0; transition: border-color 120ms, box-shadow 120ms; margin-bottom: 18px; }
  #bapp-doc-gate input:focus { outline: 0; border-color: #A50100; box-shadow: 0 0 0 3px rgba(165,1,0,0.28); }
  #bapp-doc-gate .err { background: #FBE5E5; border-left: 3px solid #A50100; padding: 10px 14px; color: #A50100; font-size: 13px; font-weight: 500; margin-bottom: 14px; display: none; }
  #bapp-doc-gate .err.show { display: block; }
  #bapp-doc-gate button { width: 100%; height: 52px; background: #A50100; color: #FFF; font-family: inherit; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; font-size: 13px; border: 0; cursor: pointer; transition: background 120ms; }
  #bapp-doc-gate button:hover { background: #8A0100; }
  #bapp-doc-gate button:active { background: #6E0100; }
  #bapp-doc-gate .foot { margin-top: 18px; font-size: 12px; color: #6F6F6F; line-height: 1.5; }
</style>
<script id="bapp-doc-gate-script">
(function(){
  var HASH="0a937db8dc7f7df2ecf0b734cf942dfd33569e6f9e4597c9695ac8a3fd7016e5"; // sha-256 Blacklist2026!
  var KEY="bapp_doc_unlocked";
  function trackHit(){
    try {
      fetch("/api/hit", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({slug: location.pathname.slice(1)}),
        keepalive: true
      }).catch(function(){});
    } catch(_){}
  }
  if (sessionStorage.getItem(KEY) === "1") { trackHit(); return; }
  document.body.classList.add("bapp-gated");
  var w = document.createElement("div");
  w.id = "bapp-doc-gate";
  w.innerHTML = '<div class="card"><span class="bar" aria-hidden="true"></span><h1>Document protected</h1><p class="sub">Enter the password provided by your Blacklist Alliance representative.</p><form id="bg-form" autocomplete="off"><label for="bg-pw">Password</label><input id="bg-pw" type="password" autocomplete="current-password" autofocus required /><div class="err" id="bg-err">Wrong password. Try again.</div><button type="submit">View document</button></form><p class="foot">Don\\'t have a password? Contact your Blacklist Alliance representative.</p></div>';
  document.body.appendChild(w);
  async function sha256(t){var b=new TextEncoder().encode(t);var h=await crypto.subtle.digest("SHA-256",b);return Array.from(new Uint8Array(h)).map(function(x){return x.toString(16).padStart(2,"0");}).join("");}
  document.getElementById("bg-form").addEventListener("submit", async function(e){
    e.preventDefault();
    var v = document.getElementById("bg-pw").value;
    if (await sha256(v) === HASH) {
      sessionStorage.setItem(KEY, "1");
      document.body.classList.remove("bapp-gated");
      w.remove();
      trackHit();
    } else {
      document.getElementById("bg-err").classList.add("show");
      document.getElementById("bg-pw").select();
    }
  });
})();
</script>
`;

function injectGate(html) {
  if (typeof html !== 'string') return html;
  if (html.includes('id="bapp-doc-gate-script"')) return html;
  if (html.includes('</body>')) {
    return html.replace('</body>', `${GATE_SNIPPET}</body>`);
  }
  return html + GATE_SNIPPET;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, html: rawHtml, apiKey } = req.body;
  const html = injectGate(rawHtml);

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
