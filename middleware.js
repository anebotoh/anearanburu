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
  :root { --bg:#0C0C0F; --surface:#17171c; --border:#222227; --text:#f0ede8; --body:#b6b3ad; --muted:#8a8a8f; }
  body { background: var(--bg); color: var(--text); font-family: 'Schibsted Grotesk', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; -webkit-font-smoothing: antialiased; }
  .card { width: 100%; max-width: 440px; text-align: center; animation: in .4s ease both; }
  @keyframes in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .eyebrow { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); margin-bottom: 20px; }
  h1 { font-weight: 400; letter-spacing: -.04em; font-size: clamp(42px, 8vw, 66px); line-height: .95; color: #fff; margin-bottom: 20px; }
  .lead { font-size: 16px; line-height: 1.5; color: var(--body); margin: 0 auto 38px; max-width: 32ch; }
  form { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 220px; margin: 0 auto; }
  .field label { display: block; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 13px 16px; color: var(--text); font-family: inherit; font-size: 15px; text-align: center; transition: border-color .2s ease; }
  input:focus { outline: none; border-color: #45454d; }
  input::placeholder { color: #55555c; }
  button { margin-top: 10px; background: #fff; color: #0C0C0F; border: none; border-radius: 10px; padding: 14px; font-family: inherit; font-size: 15px; font-weight: 600; letter-spacing: -.01em; cursor: pointer; transition: transform .15s ease, opacity .2s ease; }
  button:hover { transform: translateY(-1px); opacity: .92; }
  .error { font-size: 13px; color: #ff6b6b; min-height: 18px; }
  .foot { margin-top: 30px; font-size: 13px; color: var(--muted); }
  .foot a { color: var(--text); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--muted); transition: text-decoration-color .2s; }
  .foot a:hover { text-decoration-color: var(--text); }
</style>
</head>
<body>
  <main class="card">
    <p class="eyebrow">Selected work</p>
    <h1>Case studies</h1>
    <p class="lead">These case studies are password-protected. Enter the details I shared with you to take a look.</p>
    <form method="POST" autocomplete="off">
      <div class="field">
        <label for="u">Username</label>
        <input id="u" name="username" placeholder="ane" autocapitalize="off" autocorrect="off" spellcheck="false" required>
      </div>
      <div class="field">
        <label for="p">Password</label>
        <input id="p" name="password" type="password" placeholder="••••••••" required>
      </div>
      <p class="error">${error}</p>
      <button type="submit">Let's go</button>
    </form>
    <p class="foot">Don't have access? <a href="mailto:aranburuane@gmail.com">Get in touch</a>.</p>
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
