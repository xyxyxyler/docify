import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const path = req.nextUrl.pathname;

    // Protected routes - redirect to login if not authenticated
    const protectedPaths = ['/dashboard', '/workspace', '/admin'];
    const isProtectedPath = protectedPaths.some(p => path.startsWith(p));

    if (isProtectedPath) {
        if (!session) {
            const redirectUrl = new URL('/login', req.url);
            return NextResponse.redirect(redirectUrl);
        }

        // Check user status
        const { data: profile } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', session.user.id)
            .single();

        // If suspended or banned, redirect to blocked page
        // But allow access to /blocked itself (handled below)
        if (profile && (profile.status === 'suspended' || profile.status === 'banned')) {
            const blockedUrl = new URL('/blocked', req.url);
            return NextResponse.redirect(blockedUrl);
        }
    }

    // Auth routes - redirect to dashboard if already authenticated
    const authPaths = ['/login', '/signup'];
    const isAuthPath = authPaths.includes(path);

    if (isAuthPath && session) {
        // Check status before redirecting to dashboard
        const { data: profile } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', session.user.id)
            .single();

        if (profile && (profile.status === 'suspended' || profile.status === 'banned')) {
            const blockedUrl = new URL('/blocked', req.url);
            return NextResponse.redirect(blockedUrl);
        }

        const redirectUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    // Blocked page - redirect to dashboard if active
    if (path === '/blocked' && session) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', session.user.id)
            .single();

        if (profile && profile.status === 'active') {
            const dashboardUrl = new URL('/dashboard', req.url);
            return NextResponse.redirect(dashboardUrl);
        }
    }

    return res;
}

export const config = {
    matcher: ['/dashboard/:path*', '/workspace/:path*', '/admin/:path*', '/login', '/signup', '/blocked'],
};

