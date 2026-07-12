import type { APIContext } from 'astro';
import { createToken, hashToken } from './security';
import { withConnection } from './oracle';

export type SessionUser = {
    id: number;
    username: string;
    email: string;
    avatarUrl: string;
};

type SessionLocals = {
    fotolifeAuthResolved?: boolean;
    fotolifeUser?: SessionUser | null;
};

function sessionLocals(context: APIContext): SessionLocals {
    return context.locals as SessionLocals;
}

function cookieName(): string {
    return import.meta.env.SESSION_COOKIE_NAME || 'fotolife_session';
}

function sessionDays(): number {
    return Math.max(1, Number(import.meta.env.SESSION_DAYS || 30));
}

export async function createSession(context: APIContext, userId: number, provider: 'password' | 'google', remember = true): Promise<void> {
    const token = createToken();
    const days = remember ? sessionDays() : 1;

    await withConnection(async connection => {
        await connection.execute(
            `INSERT INTO murm_session
             (
                 user_id,
                 token_hash,
                 provider,
                 expires_at,
                 ip_address,
                 user_agent
             )
             VALUES
             (
                 :user_id,
                 :token_hash,
                 :provider,
                 SYSTIMESTAMP + NUMTODSINTERVAL(:days, 'DAY'),
                 :ip_address,
                 :user_agent
             )`,
            {
                user_id: userId,
                token_hash: hashToken(token),
                provider,
                days,
                ip_address: context.clientAddress || null,
                user_agent: context.request.headers.get('user-agent') || null,
            },
            { autoCommit: true },
        );
    });

    const locals = sessionLocals(context);
    locals.fotolifeAuthResolved = false;
    locals.fotolifeUser = null;

    context.cookies.set(cookieName(), token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: context.url.protocol === 'https:',
        maxAge: remember ? days * 86400 : undefined,
    });
}

export async function revokeSession(context: APIContext): Promise<void> {
    const token = context.cookies.get(cookieName())?.value;
    if (token) {
        await withConnection(async connection => {
            await connection.execute(
                `UPDATE murm_session
                 SET revoked_at = SYSTIMESTAMP
                 WHERE token_hash = :token_hash
                   AND revoked_at IS NULL`,
                { token_hash: hashToken(token) },
                { autoCommit: true },
            );
        });
    }
    context.cookies.delete(cookieName(), { path: '/' });
    const locals = sessionLocals(context);
    locals.fotolifeAuthResolved = true;
    locals.fotolifeUser = null;
}

export async function currentUser(context: APIContext): Promise<SessionUser | null> {
    const locals = sessionLocals(context);
    if (locals.fotolifeAuthResolved) return locals.fotolifeUser ?? null;

    const token = context.cookies.get(cookieName())?.value;
    if (!token) {
        locals.fotolifeAuthResolved = true;
        locals.fotolifeUser = null;
        return null;
    }

    const user = await withConnection(async connection => {
        const result = await connection.execute<Record<string, unknown>>(
            `SELECT u.id,
                    u.username,
                    u.email,
                    CASE
                        WHEN u.avatar_image IS NOT NULL THEN
                            '/api/users/' || u.id || '/avatar?v=' || TO_CHAR(u.avatar_updated_at, 'YYYYMMDDHH24MISSFF3')
                        ELSE NVL(u.avatar_url, '')
                    END AS avatar_url
             FROM murm_session s
             JOIN murm_user u
               ON u.id = s.user_id
             WHERE s.token_hash = :token_hash
               AND s.revoked_at IS NULL
               AND s.expires_at > SYSTIMESTAMP
               AND u.active = 1`,
            { token_hash: hashToken(token) },
        );
        const row = result.rows?.[0];
        if (!row) return null;
        return {
            id: Number(row.ID),
            username: String(row.USERNAME),
            email: String(row.EMAIL),
            avatarUrl: String(row.AVATAR_URL || ''),
        };
    });

    locals.fotolifeAuthResolved = true;
    locals.fotolifeUser = user;
    return user;
}


export function invalidateCurrentUser(context: APIContext): void {
    const locals = sessionLocals(context);
    locals.fotolifeAuthResolved = false;
    locals.fotolifeUser = null;
}

export async function requireUser(context: APIContext): Promise<SessionUser> {
    const user = await currentUser(context);
    if (!user) throw new Error('NAO_AUTENTICADO');
    return user;
}
