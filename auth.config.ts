import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const protectedPaths = [
                '/dashboard',
                '/timeline',
                '/journals',
                '/entries',
                '/insights',
                '/relations',
                '/search',
                '/settings',
                '/users',
            ];
            const isOnProtected = protectedPaths.some(p => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + '/'));
            if (isOnProtected) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // If logged in and on login page or home page, redirect to dashboard
                if (nextUrl.pathname === '/login' || nextUrl.pathname === '/') {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return true
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
