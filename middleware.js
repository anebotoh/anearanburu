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
  body { background: var(--bg); color: var(--text); font-family: 'Schibsted Grotesk', sans-serif; min-height: 100vh; display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; }
  .topbar { display: flex; align-items: center; justify-content: space-between; height: 70px; padding: 0 var(--margin); }
  .topbar-left { display: flex; align-items: center; gap: 10px; }
  .topbar-name { color: var(--text); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; text-decoration: none; transition: opacity .2s; }
  .topbar-name:hover { opacity: .7; }
  .topbar-meta { font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .topbar-links { display: flex; gap: 4px; margin-right: -16px; }
  .topbar-links a { font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.3); text-decoration: none; padding: 8px 16px; border-radius: 100px; transition: color .2s; }
  .topbar-links a:hover, .topbar-links a.is-active { color: var(--text); }
  .card { flex: 1; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; text-align: left; gap: 40px; padding: 40px var(--margin) 48px; animation: in .4s ease both; }
  @keyframes in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .gate-intro { display: flex; flex-direction: column; gap: 16px; }
  .gate-intro h1 { font-size: 23px; line-height: 1.3; letter-spacing: -.02em; font-weight: 400; color: var(--text); }
  .gate-intro p { font-size: 23px; line-height: 1.3; letter-spacing: -.02em; font-weight: 400; color: var(--text); margin: 0; }
  .gate-intro p.gate-dim { color: var(--muted); }
  .gate-intro p.gate-note { font-size: 13px; line-height: 1.5; color: var(--muted); margin-top: 4px; }
  .gate-intro a { color: inherit; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; text-decoration-color: var(--muted); transition: text-decoration-color .2s; }
  .gate-intro a:hover { text-decoration-color: var(--text); }
  form { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 240px; }
  input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 9px; padding: 11px 14px; color: var(--text); font-family: inherit; font-size: 14px; text-align: left; transition: border-color .2s ease; }
  input:focus { outline: none; border-color: #45454d; }
  input::placeholder { color: #55555c; }
  button { margin-top: 4px; background: #fff; color: #0C0C0F; border: none; border-radius: 9px; padding: 10px; font-family: inherit; font-size: 14px; font-weight: 600; letter-spacing: -.01em; cursor: pointer; transition: transform .15s ease, opacity .2s ease; }
  button:not(:disabled):hover { transform: translateY(-1px); opacity: .92; }
  button:disabled { opacity: .35; cursor: not-allowed; }
  .error { font-size: 12px; color: #ff6b6b; min-height: 16px; }
  @media (max-width: 768px) { :root { --margin:24px; } .topbar-meta { display: none; } }
  @media (max-width: 480px) { :root { --margin:20px; } .topbar-links { gap: 18px; } }
  /* Floating glass pill — primary navigation */
  .pill-bar { position: fixed; left: var(--margin); right: var(--margin); top: 18px; z-index: 200; display: flex; align-items: center; justify-content: space-between; gap: 12px; pointer-events: none; }
  .contact-pill { pointer-events: auto; position: static; left: auto; right: auto; width: auto; height: auto; display: inline-flex; align-items: center; justify-content: flex-start; gap: 6px; padding: 6px 7px 6px 8px; background: rgba(255,255,255,0.07); backdrop-filter: blur(18px) saturate(1.4); -webkit-backdrop-filter: blur(18px) saturate(1.4); border: 1px solid rgba(255,255,255,0.14); border-radius: 100px; box-shadow: 0 12px 40px rgba(0,0,0,0.45); }
  .contact-pill a { text-decoration: none; }
  .cp-identity { display: inline-flex; align-items: center; gap: 10px; padding-right: 4px; }
  .cp-avatar { position: relative; flex: 0 0 auto; width: 28px; height: 28px; border-radius: 50%; overflow: hidden; background: linear-gradient(135deg,#33333b,#4a4a53); display: inline-flex; align-items: center; justify-content: center; }
  .cp-initials { font-size: 13px; font-weight: 600; letter-spacing: .03em; color: #f0ede8; }
  .cp-avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .cp-id { display: flex; flex-direction: row; align-items: baseline; gap: 6px; line-height: 1.15; }
  .cp-name { font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: #f0ede8; }
  .cp-tag { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #8a8a8f; } .cp-tag::before { content: "\\00B7"; margin-right: 6px; }
  .cp-sep { display: none; }
  .cp-links { display: inline-flex; align-items: center; gap: 2px; }
  .cp-links a { font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,0.4); padding: 8px 12px; border-radius: 100px; white-space: nowrap; transition: color .2s ease; }
  .cp-links a:hover, .cp-links a.is-active { color: #f0ede8; }
  .cp-sayhi { padding: 8px 10px; color: #f0ede8; font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; transition: color .2s ease; }
  .cp-sayhi:hover { opacity: .7; }
  .topbar-left, .nav-left, .topbar-links, .nav-links, .nav-toggle { display: none !important; }
  @media (max-width: 760px) { .cp-id, .cp-sep { display: none; } .cp-links a { padding: 7px 9px; letter-spacing: .04em; } .pill-bar { top: 14px; gap: 8px; } .contact-pill { gap: 4px; } }
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
      <a href="/case-studies/output-creator/" class="is-active">Case studies</a>
      <a href="/about/">About</a>
      
    </nav>
  </header>
  <main class="card">
    <div class="gate-intro">
      <h1>I care about how things look, feel and work.</h1>
      <p>I bring clarity to complexity — connecting ideas, people, and systems to help teams make better decisions and build better products.</p>
      <p class="gate-dim">I currently work as a Lead Product Designer at <a href="https://output.com/" target="_blank" rel="noopener">Output</a> — designing music production tools like <a href="https://output.com/products/creator/" target="_blank" rel="noopener">Output Creator</a>. Previously at <a href="https://www.accenture.com/us-en/about/accenture-song-index" target="_blank" rel="noopener">Fjord</a> and <a href="https://fantasy.co/" target="_blank" rel="noopener">Fantasy</a>.</p>
      <p class="gate-note">Most of my work is under NDA — happy to walk you through it over a call, <a href="mailto:aranburuane@gmail.com">Get in touch</a>!</p>
    </div>
    <form method="POST" autocomplete="off">
      <input id="u" name="username" placeholder="Username" autocapitalize="off" autocorrect="off" spellcheck="false" required>
      <input id="p" name="password" type="password" placeholder="Password" required>
      <p class="error">${error}</p>
      <button id="go" type="submit" disabled>Let's go</button>
    </form>
  </main>
<div class="pill-bar" aria-label="Main navigation">
  <nav class="contact-pill pill-left">
    <a class="cp-identity" href="/home/"><span class="cp-avatar"><span class="cp-initials">AA</span><img src="/Assets/profile.jpg" alt="Ane Aranburu" onerror="this.remove()"></span><span class="cp-id"><span class="cp-name">Ane Aranburu</span><span class="cp-tag">Digital Designer</span></span></a>
    <a class="cp-sayhi" href="mailto:aranburuane@gmail.com">Say hi</a>
  </nav>
  <nav class="contact-pill pill-right">
    <span class="cp-links"><a href="/home/" data-path="home">Home</a><a href="/case-studies/output-creator/" data-path="cases">Case studies</a><a href="/about/" data-path="about">About</a></span>
  </nav>
</div>
<script>
  (function(){ var u=document.getElementById('u'), p=document.getElementById('p'), b=document.getElementById('go');
    function sync(){ b.disabled = !(u.value.trim() && p.value.trim()); }
    u.addEventListener('input', sync); p.addEventListener('input', sync); sync(); })();
</script>
<script>
  (function(){ var p=location.pathname, m={home:(p==='/'||p.indexOf('/home')===0), cases:(p.indexOf('/case-studies')===0), about:(p.indexOf('/about')===0)};
    document.querySelectorAll('.cp-links a').forEach(function(a){ if(m[a.getAttribute('data-path')]) a.classList.add('is-active'); }); })();
</script>
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
          'Location': '/case-studies/output-creator/',
          'Set-Cookie': `${COOKIE}=${expected}; Path=/case-studies; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAXAGE}`,
        },
      });
    }
    return new Response(page('Wrong username or password — try again.'), { status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }

  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)cs_auth=([^;]+)/);
  if (m && m[1] === expected) {
    const url = new URL(req.url);
    if (url.pathname === '/case-studies' || url.pathname === '/case-studies/') {
      return new Response(null, { status: 307, headers: { 'Location': '/case-studies/output-creator/' } });
    }
    return; // authenticated — pass through
  }

  return new Response(page(''), { status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
