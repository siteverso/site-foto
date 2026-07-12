import { validateMessageLength } from '../../message-limit';
import { normalizeHiddenObservedUserIds, normalizeObserverVisibility } from '../../observer-visibility';
import { normalizeSexCode } from '../../account-profile';
import { normalizeEmail, normalizeUsername, validateEmail, validateUsername } from '../security';
import { withConnection } from '../oracle';

type AccountRow = {
    USERNAME: unknown;
    EMAIL: unknown;
    BIO: unknown;
    SEX_CODE: unknown;
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

export type AccountProfile = {
    username: string;
    email: string;
    bio: string;
    sexCode: '' | 'M' | 'F';
    avatarUrl: string;
    hasPassword: boolean;
    hasGoogle: boolean;
    photoCount: number;
    messageCount: number;
    observerCount: number;
    observedCount: number;
    observerVisibility: 'public' | 'private';
    observedUsers: Array<{ id: number; username: string; avatarUrl: string; hidden: boolean }>;
};

export async function getAccountProfile(userId: number): Promise<AccountProfile> {
    return withConnection(async connection => {
        const db = connection as unknown as OracleExecutor;
        const [accountResult, observedResult] = await Promise.all([
            db.execute<AccountRow>(
                `SELECT u.username,
                        u.email,
                        NVL(u.bio, '') AS bio,
                        NVL(u.sex_code, '') AS sex_code,
                        CASE WHEN u.avatar_image IS NOT NULL THEN '/api/users/' || u.id || '/avatar?v=' || TO_CHAR(u.avatar_updated_at, 'YYYYMMDDHH24MISSFF3') ELSE NVL(u.avatar_url, '') END AS avatar_url,
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
                { id: userId },
            ),
            db.execute<ObservedRow>(
                `SELECT observed.id,
                        observed.username,
                        CASE WHEN observed.avatar_image IS NOT NULL THEN '/api/users/' || observed.id || '/avatar?v=' || TO_CHAR(observed.avatar_updated_at, 'YYYYMMDDHH24MISSFF3') ELSE NVL(observed.avatar_url, '') END AS avatar_url,
                        CASE WHEN EXISTS (
                            SELECT 1
                              FROM murm_observer_hidden hidden
                             WHERE hidden.owner_user_id = :id
                               AND hidden.hidden_user_id = observed.id
                        ) THEN 1 ELSE 0 END AS is_hidden
                   FROM murm_user observed
                  WHERE observed.active = 1
                    AND observed.id <> :id
                    AND EXISTS (
                        SELECT 1
                          FROM murm_friend friendship
                         WHERE friendship.user_id = :id
                           AND friendship.friend_user_id = observed.id
                           AND friendship.status = 'A'
                    )
                  ORDER BY LOWER(observed.username)`,
                { id: userId },
            ),
        ]);

        const row = accountResult.rows?.[0];
        if (!row) throw new Error('NAO_AUTENTICADO');

        return {
            username: String(row.USERNAME),
            email: String(row.EMAIL),
            bio: String(row.BIO || ''),
            sexCode: normalizeSexCode(row.SEX_CODE),
            avatarUrl: String(row.AVATAR_URL || ''),
            hasPassword: Number(row.HAS_PASSWORD) === 1,
            hasGoogle: Number(row.HAS_GOOGLE) === 1,
            photoCount: Number(row.PHOTO_COUNT || 0),
            messageCount: Number(row.MESSAGE_COUNT || 0),
            observerCount: Number(row.OBSERVER_COUNT || 0),
            observedCount: (observedResult.rows || []).length,
            observerVisibility: normalizeObserverVisibility(row.OBSERVER_VISIBILITY_CODE || 'public'),
            observedUsers: (observedResult.rows || []).map(item => ({
                id: Number(item.ID),
                username: String(item.USERNAME),
                avatarUrl: String(item.AVATAR_URL || ''),
                hidden: Number(item.IS_HIDDEN) === 1,
            })),
        };
    });
}

export async function updateAccountProfile(userId: number, input: {
    username?: unknown;
    email?: unknown;
    bio?: unknown;
    sexCode?: unknown;
    observerVisibility?: unknown;
    hiddenObservedUserIds?: unknown;
}): Promise<void> {
    const username = normalizeUsername(input.username);
    const email = normalizeEmail(input.email);
    const bio = validateMessageLength(input.bio, 'A apresentação');
    const sexCode = normalizeSexCode(input.sexCode);
    const observerVisibility = normalizeObserverVisibility(input.observerVisibility);
    const hiddenObservedUserIds = normalizeHiddenObservedUserIds(input.hiddenObservedUserIds);
    validateUsername(username);
    validateEmail(email);

    await withConnection(async connection => {
        const db = connection as unknown as OracleExecutor;
        try {
            await db.execute(
                `UPDATE murm_user
                    SET username = :username,
                        email = :email,
                        bio = :bio,
                        sex_code = :sex_code,
                        observer_visibility_code = :observer_visibility_code,
                        updated_at = SYSTIMESTAMP
                  WHERE id = :id`,
                {
                    username,
                    email,
                    bio: bio || null,
                    sex_code: sexCode || null,
                    observer_visibility_code: observerVisibility,
                    id: userId,
                },
            );

            await db.execute(
                `DELETE FROM murm_observer_hidden WHERE owner_user_id = :owner_user_id`,
                { owner_user_id: userId },
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
                             AND f.friend_user_id <> f.user_id
                             AND f.status = 'A'
                      )`,
                    { owner_user_id: userId, hidden_user_id: hiddenUserId },
                );
            }

            await db.commit();
        } catch (error) {
            await db.rollback();
            if (String(error).includes('ORA-00001')) throw new Error('CONTA_EXISTENTE');
            throw error;
        }
    });
}
