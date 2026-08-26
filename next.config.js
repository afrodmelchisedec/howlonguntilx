/** @type {import('next').NextConfig */ const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  images: { domains: ['lh3.googleusercontent.com'], formats: ['image/avif', 'image/webp'] },
  async redirects() {
    return [
      // Legacy Article URLs -> new merged /questions/[slug] route.
      // /tools/questions/:article is a distinct static path segment, so no
      // exclusion logic is needed here — it never collides with any other
      // top-level route.
      {
        source: '/tools/questions/:article',
        destination: '/questions/:article',
        permanent: true,
      },
      // Legacy Event URLs -> new merged /questions/[slug] route.
      // Matches a single bare top-level segment (e.g. /how-long-until-x)
      // while excluding every real static top-level route the site owns,
      // via negative lookahead, so this never intercepts /community,
      // /dashboard, etc. Also excludes any segment containing a dot, which
      // covers root-level static assets (favicon.ico, robots.txt, icon.svg,
      // sitemap.xml, etc.) as a class rather than enumerating them.
      //
      // IMPORTANT: if a new top-level static route is ever added under
      // src/app (e.g. src/app/newsection/page.tsx), it MUST be added to
      // this exclusion list too, or this redirect will incorrectly swallow
      // it. There is no automatic way to keep this in sync with src/app —
      // it has to be updated by hand alongside any new top-level route.
      {
        source: '/:slug((?!api|admin|auth|dashboard|users|about|ar|calendar|categories|community|contact|editorial-guidelines|embed|hi|legal|plugins|privacy|questions|reviewers|terms|tools|u|upgrade|[^/]*\\.[^/]*$)[^/]+)',
        destination: '/questions/:slug',
        permanent: true,
      },
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://www.paypal.com https://www.paypalobjects.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://api.paypal.com https://pagead2.googlesyndication.com",
      "frame-src 'self' https://www.paypal.com https://accounts.google.com",
      "frame-ancestors 'self'",
    ].join('; ');
    return [
      {
        // Everything except /embed and /embed/* — those keep their own rule below
        source: '/((?!embed).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        source: '/embed',
        headers: [{ key: 'X-Frame-Options', value: 'ALLOWALL' }],
      },
    ];
  },
};
export default nextConfig;
