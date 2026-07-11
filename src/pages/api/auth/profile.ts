import type { APIRoute } from 'astro';
import { body, errorResponse, json } from '../../../lib/server/http';
import { requireUser } from '../../../lib/server/session';
import { normalizeUsername, validateUsername } from '../../../lib/server/security';
import { withConnection } from '../../../lib/server/oracle';
import { validateMessageLength } from '../../../lib/message-limit';
import { normalizeHiddenObservedUserIds, normalizeObserverVisibility } from '../../../lib/observer-visibility';

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
    OBSERVER_VISIBILITY_CODE: unknown;
};

type ObservedRow = {
    ID: unknown;
    USERNAME: unknown;
    AVATAR_URL: unknown;
    IS_HIDDEN: unknown;
};

type ExecuteResult<T> = { rows?: T[]; rowsAffected?: number };

type OracleExecutor = {
    execute<T>(sql: string, binds?: Record<string, unknown>, options?: Record<string, unknown>): Promise<ExecuteResult<T>>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
};

export async function GET(context: RouteContext) {
    try {
        const user = await requireUser(context);
        const account = await withConnection(async connection => {
            const db = connection as unknown as OracleExecutor;
            const [accountResult, observedResult] = await Promise.all([
                db.execute<AccountRow>(
                    `SELECT u.username,
                            u.email,
                            NVL(u.bio, '') AS bio,
                            NVL(u.avatar_url, '') AS avatar_url,
                            NVL(u.observer_visibility_code, 'public') AS observer_visibility_code,
                            NVL2(u.password_hash, 1, 0) AS has_password,
                            NVL2(u.google_sub, 1, 0) AS has_google,
                            (SELECT COUNT(*) FROM murm_post p
                              WHERE p.user_id = u.id AND p.post_type = 'photo' AND p.status = 'published') AS photo_count,
                            (SELECT COUNT(*) FROM murm_post c
                              WHERE c.user_id = u.id AND c.post_type = 'comment' AND c.status = 'published') AS message_count,
                            (SELECT COUNT(*) FROM murm_friend f
                              WHERE f.friend_user_id = u.id AND f.status = 'A') AS observer_count
                       FROM murm_user u
                      WHERE u.id = :id
                        AND u.active = 1`,
                    { id: user.id },
                ),
                db.execute<ObservedRow>(
                    `SELECT observed.id,
                            observed.username,
                            NVL(observed.avatar_url, '') AS avatar_url,
                            CASE WHEN hidden.hidden_user_id IS NULL THEN 0 ELSE 1 END AS is_hidden
                       FROM murm_friend friendship
                       JOIN murm_user observed
                         ON observed.id = friendship.friend_user_id
                        AND observed.active = 1
                       LEFT JOIN murm_observer_hidden hidden
                         ON hidden.owner_user_id = friendship.user_id
                        AND hidden.hidden_user_id = friendship.friend_user_id
                      WHERE friendship.user_id = :id
                        AND friendship.status = 'A'
                      ORDER BY LOWER(observed.username)`,
                    { id: user.id },
                ),
            ]);

            const row = accountResult.rows?.[0];
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
                observerVisibility: normalizeObserverVisibility(row.OBSERVER_VISIBILITY_CODE || 'public'),
                observedUsers: (observedResult.rows || []).map(item => ({
                    id: Number(item.ID),
                    username: String(item.USERNAME),
                    avatarUrl: String(item.AVATAR_URL || ''),
                    hidden: Number(item.IS_HIDDEN) === 1,
                })),
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
        const input = await body<{
            username?: string;
            bio?: string;
            observerVisibility?: string;
            hiddenObservedUserIds?: unknown;
        }>(context.request);
        const username = normalizeUsername(input.username);
        const bio = validateMessageLength(input.bio, 'A apresentação');
        validateUsername(username);
        const observerVisibility = normalizeObserverVisibility(input.observerVisibility);
        const hiddenObservedUserIds = normalizeHiddenObservedUserIds(input.hiddenObservedUserIds);

        await withConnection(async connection => {
            const db = connection as unknown as OracleExecutor;
            try {
                await db.execute(
                    `UPDATE murm_user
                        SET username = :username,
                            bio = :bio,
                            observer_visibility_code = :observer_visibility_code,
                            updated_at = SYSTIMESTAMP
                      WHERE id = :id`,
                    { username, bio: bio || null, observer_visibility_code: observerVisibility, id: user.id },
                );

                await db.execute(
                    `DELETE FROM murm_observer_hidden WHERE owner_user_id = :owner_user_id`,
                    { owner_user_id: user.id },
                );

                for (const hiddenUserId of hiddenObservedUserIds) {
                    await db.execute(
                        `INSERT INTO murm_observer_hidden (owner_user_id, hidden_user_id)
                         SELECT :owner_user_id, :hidden_user_id
                           FROM dual
                          WHERE EXISTS (
                              SELECT 1
                                FROM murm_friend f
                               WHERE f.user_id = :owner_user_id
                                 AND f.friend_user_id = :hidden_user_id
                                 AND f.status = 'A'
                          )`,
                        { owner_user_id: user.id, hidden_user_id: hiddenUserId },
                    );
                }

                await db.commit();
            } catch (error) {
                await db.rollback();
                if (String(error).includes('ORA-00001')) throw new Error('CONTA_EXISTENTE');
                throw error;
            }
        });

        return json({ ok: true });
    } catch (error) {
        return errorResponse(error);
    }
}
