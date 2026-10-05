// Password-protects the /case-studies section (HTTP Basic Auth, Vercel Edge).
// Public: everything else (/, /home, /work, /about).
// Set SITE_PASSWORD in Vercel → Settings → Environment Variables. Username: ane
export const config = { matcher: ['/case-studies', '/case-studies/:path*'] };

export default function middleware(req) {
  const USER = 'ane';
  const PASS = process.env.SITE_PASSWORD || '';
  const auth = req.headers.get('authorization');
  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const i = decoded.indexOf(':');
      const user = decoded.slice(0, i);
      const pass = decoded.slice(i + 1);
      if (user === USER && pass === PASS && PASS !== '') return; // allow through
    }
  }
  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Case studies", charset="UTF-8"' },
  });
}
