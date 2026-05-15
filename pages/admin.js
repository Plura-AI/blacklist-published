import fs from 'fs';
import path from 'path';

const FONT_BASE = 'https://raw.githubusercontent.com/Plura-AI/blacklist-design-system/main/fonts';

export async function getServerSideProps() {
  const publishedDir = path.join(process.cwd(), 'published');
  let pages = [];

  if (fs.existsSync(publishedDir)) {
    const files = fs
      .readdirSync(publishedDir)
      .filter((f) => f.endsWith('.html') && f !== '.gitkeep');

    pages = files.map((f) => {
      const slug = f.replace('.html', '');
      const stat = fs.statSync(path.join(publishedDir, f));
      return {
        slug,
        url: `https://go.blacklistalliance.com/${slug}`,
        published: stat.mtime.toISOString(),
      };
    }).sort((a, b) => new Date(b.published) - new Date(a.published));
  }

  return { props: { pages } };
}

export default function Admin({ pages }) {
  const handleDelete = async (slug) => {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    const res = await fetch('/api/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        apiKey: document.getElementById('apiKeyInput')?.value || '',
      }),
    });
    const data = await res.json();
    if (data.ok) {
      alert(`"${slug}" deleted. Page will be removed after Vercel rebuilds (~30s).`);
      window.location.reload();
    } else {
      alert(`Error: ${data.error}`);
    }
  };

  return (
    <>
      <style>{`
        @font-face {
          font-family: "General Sans";
          src: url("${FONT_BASE}/GeneralSans-Regular.woff2") format("woff2");
          font-weight: 400; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "General Sans";
          src: url("${FONT_BASE}/GeneralSans-Medium.woff2") format("woff2");
          font-weight: 500; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "General Sans";
          src: url("${FONT_BASE}/GeneralSans-Semibold.woff2") format("woff2");
          font-weight: 600; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: "General Sans";
          src: url("${FONT_BASE}/GeneralSans-Bold.woff2") format("woff2");
          font-weight: 700; font-style: normal; font-display: swap;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bl-red:    #A50100;
          --bl-black:  #000000;
          --bl-white:  #FFFFFF;
          --gray-05:   #F7F7F7;
          --gray-10:   #EFEFEF;
          --gray-20:   #E0E0E0;
          --gray-30:   #C9C9C9;
          --gray-60:   #6F6F6F;
          --gray-70:   #525252;
          --gray-90:   #1F1F1F;
          --font-sans: "General Sans", ui-sans-serif, system-ui, Arial, sans-serif;
        }

        html, body {
          font-family: var(--font-sans);
          font-size: 16px;
          background: var(--gray-05);
          color: var(--bl-black);
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        /* ---- Header ---- */
        .header {
          background: var(--bl-black);
          border-bottom: 1px solid #1F1F1F;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-mark {
          width: 28px;
          height: 28px;
          background: var(--bl-red);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .logo-mark svg { width: 16px; height: 16px; }
        .logo-wordmark {
          font-size: 13px;
          font-weight: 600;
          color: var(--bl-white);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: 1.2;
        }
        .logo-wordmark span {
          display: block;
          font-weight: 400;
          font-size: 11px;
          color: var(--gray-30);
          letter-spacing: 0.06em;
        }
        .header-badge {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gray-60);
        }

        /* ---- Main ---- */
        .main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        /* ---- Page heading ---- */
        .page-heading {
          margin-bottom: 40px;
        }
        .risk-bar {
          display: block;
          width: 56px;
          height: 4px;
          background: var(--bl-red);
          margin-bottom: 16px;
        }
        .page-heading h1 {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-bottom: 6px;
        }
        .page-heading p {
          font-size: 14px;
          color: var(--gray-70);
          font-weight: 400;
        }
        .page-heading strong {
          color: var(--bl-black);
          font-weight: 600;
        }

        /* ---- API key input (for delete) ---- */
        .apikey-bar {
          background: var(--bl-white);
          border: 1px solid var(--gray-20);
          padding: 16px 20px;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .apikey-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gray-60);
          white-space: nowrap;
        }
        .apikey-input {
          flex: 1;
          border: 1px solid var(--gray-20);
          border-radius: 0;
          padding: 8px 12px;
          font-family: var(--font-sans);
          font-size: 13px;
          background: var(--gray-05);
          color: var(--bl-black);
          outline: none;
        }
        .apikey-input:focus {
          border-color: var(--bl-red);
          box-shadow: 0 0 0 3px rgba(165,1,0,0.12);
        }

        /* ---- Empty state ---- */
        .empty {
          background: var(--bl-white);
          border: 1px solid var(--gray-20);
          padding: 64px 24px;
          text-align: center;
        }
        .empty p {
          color: var(--gray-60);
          font-size: 15px;
        }
        .empty strong { color: var(--bl-black); font-weight: 600; }

        /* ---- Table ---- */
        .table-wrap {
          background: var(--bl-white);
          border: 1px solid var(--gray-20);
          overflow: hidden;
        }
        .table-header {
          background: var(--bl-black);
          padding: 12px 20px;
          display: grid;
          grid-template-columns: 1fr 180px 120px 80px;
          gap: 16px;
          align-items: center;
        }
        .table-header span {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gray-30);
        }
        .table-row {
          display: grid;
          grid-template-columns: 1fr 180px 120px 80px;
          gap: 16px;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid var(--gray-10);
          transition: background 120ms ease;
        }
        .table-row:last-child { border-bottom: 0; }
        .table-row:hover { background: var(--gray-05); }

        .row-slug {
          font-size: 14px;
          font-weight: 600;
          color: var(--bl-black);
          word-break: break-all;
        }
        .row-date {
          font-size: 13px;
          color: var(--gray-60);
        }
        .row-link a {
          font-size: 13px;
          font-weight: 500;
          color: var(--bl-red);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .row-link a:hover { text-decoration: underline; text-underline-offset: 3px; }

        .btn-delete {
          background: transparent;
          border: 1px solid var(--gray-20);
          border-radius: 0;
          padding: 6px 12px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--gray-60);
          cursor: pointer;
          transition: all 150ms ease;
          white-space: nowrap;
        }
        .btn-delete:hover {
          background: var(--bl-red);
          border-color: var(--bl-red);
          color: var(--bl-white);
        }

        /* ---- Count bar ---- */
        .count-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .count-bar span {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--gray-60);
        }

        /* ---- Footer ---- */
        .footer {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 24px 40px;
          border-top: 1px solid var(--gray-20);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer span {
          font-size: 12px;
          color: var(--gray-60);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .footer a {
          font-size: 12px;
          color: var(--bl-red);
          text-decoration: none;
          font-weight: 500;
        }
        .footer a:hover { text-decoration: underline; }

        @media (max-width: 700px) {
          .table-header, .table-row {
            grid-template-columns: 1fr 1fr;
          }
          .table-header span:nth-child(2),
          .table-header span:nth-child(3),
          .row-date, .row-link { display: none; }
        }
      `}</style>

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <div className="logo-mark">
              {/* Red B mark */}
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="2" y="13" fontFamily="serif" fontSize="14" fontWeight="bold" fill="#FFFFFF">B</text>
              </svg>
            </div>
            <div className="logo-wordmark">
              Blacklist Alliance
              <span>Proposal Publisher</span>
            </div>
          </div>
          <span className="header-badge">BAPP Admin</span>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="page-heading">
          <span className="risk-bar" />
          <h1>Published Pages</h1>
          <p>
            <strong>{pages.length}</strong>{' '}
            {pages.length === 1 ? 'page' : 'pages'} live at{' '}
            <strong>go.blacklistalliance.com</strong>
          </p>
        </div>

        {/* API key input — needed for delete */}
        <div className="apikey-bar">
          <span className="apikey-label">API Key</span>
          <input
            id="apiKeyInput"
            type="password"
            className="apikey-input"
            placeholder="Enter BAPP API key to enable delete"
            autoComplete="off"
          />
        </div>

        {pages.length === 0 ? (
          <div className="empty">
            <p>No pages published yet. Use <strong>BAPP</strong> in Cowork to publish your first asset.</p>
          </div>
        ) : (
          <>
            <div className="count-bar">
              <span>{pages.length} {pages.length === 1 ? 'page' : 'pages'}</span>
            </div>
            <div className="table-wrap">
              <div className="table-header">
                <span>Slug</span>
                <span>Published</span>
                <span>Live URL</span>
                <span>Actions</span>
              </div>
              {pages.map((page) => (
                <div key={page.slug} className="table-row">
                  <div className="row-slug">{page.slug}</div>
                  <div className="row-date">
                    {new Date(page.published).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </div>
                  <div className="row-link">
                    <a href={page.url} target="_blank" rel="noreferrer">
                      View ↗
                    </a>
                  </div>
                  <div>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(page.slug)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <span>Blacklist Alliance · BAPP v1.0</span>
        <a
          href="https://github.com/Plura-AI/blacklist-published"
          target="_blank"
          rel="noreferrer"
        >
          GitHub →
        </a>
      </footer>
    </>
  );
}
