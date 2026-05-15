import fs from 'fs';
import path from 'path';

// Serve the raw published HTML document
export async function getServerSideProps({ params, res }) {
  const slug = params.slug;

  // Block reserved paths
  const reserved = ['admin', 'api', '_next', 'favicon.ico'];
  if (reserved.includes(slug)) {
    return { notFound: true };
  }

  const filePath = path.join(process.cwd(), 'published', `${slug}.html`);

  if (!fs.existsSync(filePath)) {
    return { notFound: true };
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);

  // Return empty props — response already sent above
  return { props: {} };
}

// Never actually renders — getServerSideProps ends the response first
export default function PublishedPage() {
  return null;
}
