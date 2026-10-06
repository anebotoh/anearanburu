// Password gate for /case-studies/* — custom login form + cookie (Vercel Edge Middleware).
// Public: everything else. Username: ane. Password: WORK_PASSWORD (or SITE_PASSWORD) env var.
export const config = { matcher: ['/case-studies', '/case-studies/:path*'] };

const USER = 'ane';
const COOKIE = 'cs_auth';
const MAXAGE = 60 * 60 * 24 * 30; // 30 days

async function token(pass) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cs-v1:' + pass));
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}

function page(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Case studies · Ane Aranburu</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:ital,wght@0,400..700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scrollbar-gutter: stable; }
  :root { --bg:#0C0C0F; --surface:#17171c; --border:#222227; --text:#f0ede8; --body:#b6b3ad; --muted:#8a8a8f; --margin:48px; }
  body { background: var(--bg); color: var(--text); font-family: 'Schibsted Grotesk', sans-serif; min-height: 100vh; display: flex; flex-direction: column; padding: 24px var(--margin); -webkit-font-smoothing: antialiased; }
  .topbar { display: flex; align-items: center; justify-content: space-between; height: 70px; }
  .topbar-left { display: flex; align-items: center; gap: 10px; }
  .topbar-name { color: var(--text); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; text-decoration: none; transition: opacity .2s; }
  .topbar-name:hover { opacity: .7; }
  .topbar-meta { font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .topbar-links { display: flex; gap: 4px; margin-right: -16px; }
  .topbar-links a { font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.3); text-decoration: none; padding: 8px 16px; border-radius: 100px; transition: color .2s; }
  .topbar-links a:hover, .topbar-links a.is-active { color: var(--text); }
  .card { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; animation: in .4s ease both; }
  @keyframes in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .eyebrow { font-size: 12px; letter-spacing: .02em; color: var(--muted); margin-bottom: 10px; }
  .lead { font-size: 15px; line-height: 1.5; color: var(--body); margin: 0 0 24px; }
  form { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 240px; }
  input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 9px; padding: 9px 13px; color: var(--text); font-family: inherit; font-size: 14px; text-align: center; transition: border-color .2s ease; }
  input:focus { outline: none; border-color: #45454d; }
  input::placeholder { color: #55555c; }
  button { margin-top: 4px; background: #fff; color: #0C0C0F; border: none; border-radius: 9px; padding: 10px; font-family: inherit; font-size: 14px; font-weight: 600; letter-spacing: -.01em; cursor: pointer; transition: transform .15s ease, opacity .2s ease; }
  button:hover { transform: translateY(-1px); opacity: .92; }
  .error { font-size: 12px; color: #ff6b6b; min-height: 16px; }
  @media (max-width: 768px) { :root { --margin:24px; } .topbar-meta { display: none; } }
  @media (max-width: 480px) { :root { --margin:20px; } .topbar-links { gap: 18px; } }
</style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-left">
      <a class="topbar-name" href="/home/">Ane Aranburu</a>
      <span class="topbar-meta">Digital Designer</span>
    </div>
    <nav class="topbar-links">
      <a href="/home/">Home</a>
      <a href="/case-studies/" class="is-active">Case studies</a>
      <a href="/about/">About</a>
      <a href="mailto:aranburuane@gmail.com">Email</a>
    </nav>
  </header>
  <main class="card">
    <p class="eyebrow">Selected work</p>
    <p class="lead">These case studies are password-protected.</p>
    <form method="POST" autocomplete="off">
      <input id="u" name="username" placeholder="Username" autocapitalize="off" autocorrect="off" spellcheck="false" required>
      <input id="p" name="password" type="password" placeholder="Password" required>
      <p class="error">${error}</p>
      <button type="submit">Let's go</button>
    </form>
  </main>
</body>
</html>`;
}

export default async function middleware(req) {
  const PASS = process.env.WORK_PASSWORD || process.env.SITE_PASSWORD || '';
  if (!PASS) {
    return new Response(page(''), { status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
  const expected = await token(PASS);

  if (req.method === 'POST') {
    let u = '', p = '';
    try { const f = await req.formData(); u = String(f.get('username') || ''); p = String(f.get('password') || ''); } catch (e) {}
    if (u === USER && p === PASS) {
      const url = new URL(req.url);
      return new Response(null, {
        status: 303,
        headers: {
          'Location': url.pathname + (url.search || ''),
          'Set-Cookie': `${COOKIE}=${expected}; Path=/case-studies; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAXAGE}`,
        },
      });
    }
    return new Response(page('Wrong username or password — try again.'), { status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }

  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)cs_auth=([^;]+)/);
  if (m && m[1] === expected) return; // authenticated — pass through

  return new Response(page(''), { status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
