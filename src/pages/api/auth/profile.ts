import type { APIRoute } from 'astro';
import { body, errorResponse, json } from '../../../lib/server/http';
import { requireUser } from '../../../lib/server/session';
import { normalizeUsername, validateUsername } from '../../../lib/server/security';
import { withConnection } from '../../../lib/server/oracle';
import { validateMessageLength } from '../../../lib/message-limit';

type RouteContext = Parameters<APIRoute>[0];

type AccountRow = {
    USERNAME: unknown;
    EMAIL: unknown;
    BIO: unknown;
    AVATAR_URL: unknown;
    HAS_PASSWORD: unknown;
    HAS_GOOGLE: unknown;
    PHOTO_COUNT: unknown;
    MESSAGE_COUNT: unknown;
    OBSERVER_COUNT: unknown;
};

type ExecuteResult<T> = {
    rows?: T[];
};

type OracleExecutor = {
    execute<T>(
        sql: string,
        binds?: Record<string, unknown>,
        options?: Record<string, unknown>,
    ): Promise<ExecuteResult<T>>;
};

export async function GET(context: RouteContext) {
    try {
        const user = await requireUser(context);
        const account = await withConnection(async connection => {
            const db = connection as unknown as OracleExecutor;
            const result = await db.execute<AccountRow>(
                `SELECT u.username,
                        u.email,
                        NVL(u.bio, '') AS bio,
                        NVL(u.avatar_url, '') AS avatar_url,
                        NVL2(u.password_hash, 1, 0) AS has_password,
                        NVL2(u.google_sub, 1, 0) AS has_google,
                        (SELECT COUNT(*)
                           FROM murm_post p
                          WHERE p.user_id = u.id
                            AND p.post_type = 'photo'
                            AND p.status = 'published') AS photo_count,
                        (SELECT COUNT(*)
                           FROM murm_post c
                          WHERE c.user_id = u.id
                            AND c.post_type = 'comment'
                            AND c.status = 'published') AS message_count,
                        (SELECT COUNT(*)
                           FROM murm_friend f
                          WHERE f.friend_user_id = u.id
                            AND f.status = 'A') AS observer_count
                   FROM murm_user u
                  WHERE u.id = :id
                    AND u.active = 1`,
                { id: user.id },
            );

            const row = result.rows?.[0];
            if (!row) throw new Error('NAO_AUTENTICADO');

            return {
                username: String(row.USERNAME),
                email: String(row.EMAIL),
                bio: String(row.BIO || ''),
                avatarUrl: String(row.AVATAR_URL || ''),
                hasPassword: Number(row.HAS_PASSWORD) === 1,
                hasGoogle: Number(row.HAS_GOOGLE) === 1,
                photoCount: Number(row.PHOTO_COUNT || 0),
                messageCount: Number(row.MESSAGE_COUNT || 0),
                observerCount: Number(row.OBSERVER_COUNT || 0),
            };
        });

        return json({ ok: true, account });
    } catch (error) {
        return errorResponse(error);
    }
}

export async function PATCH(context: RouteContext) {
    try {
        const user = await requireUser(context);
        const input = await body<{ username?: string; bio?: string }>(context.request);
        const username = normalizeUsername(input.username);
        const bio = validateMessageLength(input.bio, 'A apresentação');
        validateUsername(username);

        await withConnection(async connection => {
            const db = connection as unknown as OracleExecutor;

            try {
                await db.execute(
                    `UPDATE murm_user
                        SET username = :username,
                            bio = :bio,
                            updated_at = SYSTIMESTAMP
                      WHERE id = :id`,
                    { username, bio: bio || null, id: user.id },
                    { autoCommit: true },
                );
            } catch (error) {
                if (String(error).includes('ORA-00001')) {
                    throw new Error('CONTA_EXISTENTE');
                }
                throw error;
            }
        });

        return json({ ok: true });
    } catch (error) {
        return errorResponse(error);
    }
}