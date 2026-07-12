import { defineMiddleware } from 'astro:middleware';
import { currentUser } from './lib/server/session';

const PUBLIC_PAGES = new Set([
    '/login',
    '/criar-conta',
    '/lembrar-senha',
]);

const PUBLIC_API_PREFIXES = [
    '/api/auth/login',
    '/api/auth/google',
    '/api/auth/signup',
    '/api/auth/reset-password',
    '/api/users/',
];

const PUBLIC_ASSET_PREFIXES = [
    '/_astro/',
    '/favicon',
    '/robots.txt',
    '/storage/',
];

function isPublicPath(pathname: string): boolean {
    if (PUBLIC_PAGES.has(pathname)) return true;
    if (PUBLIC_API_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true;
    return PUBLIC_ASSET_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function loginUrl(requestUrl: URL): URL {
    const login = new URL('/login', requestUrl);
    const destination = `${requestUrl.pathname}${requestUrl.search}`;
    if (destination !== '/') login.searchParams.set('next', destination);
    return login;
}

function unauthorizedApi(): Response {
    return new Response(JSON.stringify({ ok: false, error: 'NAO_AUTENTICADO' }), {
        status: 401,
        headers: { 'content-type': 'application/json; charset=utf-8' },
    });
}

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url;

    if (isPublicPath(pathname)) return next();

    const user = await currentUser(context);
    if (!user) {
        return pathname.startsWith('/api/')
            ? unauthorizedApi()
            : context.redirect(loginUrl(context.url).toString(), 302);
    }

    try {
        return await next();
    } catch (error) {
        if (!(error instanceof Error) || error.message !== 'NAO_AUTENTICADO') throw error;

        return pathname.startsWith('/api/')
            ? unauthorizedApi()
            : context.redirect(loginUrl(context.url).toString(), 302);
    }
});
