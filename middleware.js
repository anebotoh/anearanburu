// middleware.js
export const config = { matcher: '/work/:path*' };

export default function middleware(req) {
  const auth = req.headers.get('authorization');
  const expected = 'Basic ' + btoa('ane:' + process.env.WORK_PASSWORD);
  if (auth === expected) return; // let it through
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Work"' },
  });
}
