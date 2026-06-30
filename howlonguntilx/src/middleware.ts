
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

const LOCALES = ['en', 'hi', 'ar'];
const DEFAULT_LOCALE = 'en';

function getLocale(req: NextRequest): string {
  const accept = req.headers.get('accept-language') ?? '';
  for (const lang of accept.split(',')) {
    const code = lang.split(';')[0].trim().slice(0, 2).toLowerCase();
    if (LOCALES.includes(code)) return code;
  }
  return DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth/api/assets
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') ||
      pathname.startsWith('/admin') || pathname.startsWith('/auth') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Protect dashboard
  if (pathname.startsWith('/dashboard')) {
    // Let next-auth handle this via its own middleware logic
    return NextResponse.next();
  }

  // If already has locale prefix, continue
  if (LOCALES.some(l => pathname.startsWith('/' + l + '/') || pathname === '/' + l)) {
    return NextResponse.next();
  }

  // Detect locale and redirect root
  if (pathname === '/') {
    const locale = getLocale(req);
    if (locale !== DEFAULT_LOCALE) {
      return NextResponse.redirect(new URL('/' + locale, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
