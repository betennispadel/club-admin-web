import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for API routes, static files, etc.
  matcher: [
    // Match root
    '/',
    // Match locale prefixed paths
    '/(tr|en|de|fr|es|it|pt|ru|ar|zh|ja)/:path*',
    // Match paths without locale prefix (for redirect)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
