/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { domains: ['lh3.googleusercontent.com'], formats: ['image/avif', 'image/webp'] },
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
