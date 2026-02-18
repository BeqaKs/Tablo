import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the path starts with /ka or /en
    const localePrefixes = ['/ka', '/en'];
    const matchedPrefix = localePrefixes.find(prefix => pathname.startsWith(prefix));

    if (matchedPrefix) {
        // Determine the new path by removing the prefix
        const newPath = pathname.slice(matchedPrefix.length) || '/';

        // Create the redirect URL
        const url = request.nextUrl.clone();
        url.pathname = newPath;

        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    // Match all paths except for:
    // 1. /api routes
    // 2. /_next (Next.js internals)
    // 3. /_static (inside /public)
    // 4. all root files inside /public (e.g. /favicon.ico)
    matcher: ['/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)'],
};
