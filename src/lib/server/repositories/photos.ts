// noinspection SqlResolve,JSUnusedGlobalSymbols
import { Buffer } from 'node:buffer';
import oracledb from 'oracledb';
import { withConnection } from '../oracle';
import { normalizeSexCode } from '../../account-profile';
import { getPhotoPostCutoffSql, getPhotoPostIntervalSeconds, normalizePhotoPostIntervalType, normalizePhotoPostLimit, type PhotoPostIntervalType } from '../../photo-post-limit';

type OracleRow = Record<string, unknown> & {
    ID?: unknown;
    USER_ID?: unknown;
    USERNAME?: unknown;
    AVATAR_URL?: unknown;
    CAPTION?: unknown;
    PUBLISHED_AT?: unknown;
    MESSAGE?: unknown;
    CREATED_AT?: unknown;
    TOTAL?: unknown;
    IS_PRIVATE?: unknown;
    CAN_READ?: unknown;
    IMAGE_BLOB?: unknown;
    IMAGE_MIME_TYPE?: unknown;
    BIO?: unknown;
    SEX_CODE?: unknown;
};

export type PhotoCard = {
    id: number;
    userId: number;
    username: string;
    avatarUrl: string;
    caption: string;
    publishedAt: string;
};

export type PhotoComment = {
    id: number;
    userId: number;
    username: string;
    message: string;
    createdAt: string;
    isPrivate: boolean;
    canRead: boolean;
};

export type PhotoCommentsPage = {
    items: PhotoComment[];
    total: number;
};

function card(row: OracleRow): PhotoCard {
    return {
        id: Number(row.ID),
        userId: Number(row.USER_ID),
        username: String(row.USERNAME),
        avatarUrl: String(row.AVATAR_URL || ''),
        caption: String(row.CAPTION || ''),
        publishedAt: String(row.PUBLISHED_AT),
    };
}

export async function getTodayPhoto(userId: number): Promise<PhotoCard | null> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT *
             FROM (
                 SELECT p.id,
                        p.user_id,
                        u.username,
                        NVL(u.avatar_url, '') AS avatar_url,
                        NVL(p.contents, '') AS caption,
                        TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at
                 FROM murm_post p
                 JOIN murm_user u ON u.id = p.user_id
                 WHERE p.user_id = :user_id
                   AND p.post_type = 'photo'
                   AND p.status = 'published'
                 ORDER BY p.created_at DESC
             )
             WHERE ROWNUM = 1`,
            { user_id: userId },
        );
        return result.rows?.[0] ? card(result.rows[0]) : null;
    });
}

export async function getObservedPhotos(userId: number, includeHidden = true): Promise<PhotoCard[]> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT *
             FROM (
                 SELECT p.id,
                        p.user_id,
                        u.username,
                        NVL(u.avatar_url, '') AS avatar_url,
                        NVL(p.contents, '') AS caption,
                        TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at,
                        ROW_NUMBER() OVER (PARTITION BY f.friend_user_id ORDER BY p.created_at DESC, p.id DESC) AS user_photo_order
                 FROM murm_friend f
                 JOIN murm_post p ON p.user_id = f.friend_user_id
                 JOIN murm_user u ON u.id = p.user_id
                 WHERE f.user_id = :user_id
                   AND f.status = 'A'
                   AND (
                       :include_hidden = 1
                       OR NOT EXISTS (
                           SELECT 1
                           FROM murm_observer_hidden h
                           WHERE h.owner_user_id = f.user_id
                             AND h.hidden_user_id = f.friend_user_id
                       )
                   )
                   AND p.post_type = 'photo'
                   AND p.status = 'published'
             )
             WHERE user_photo_order = 1
               AND ROWNUM <= 8
             ORDER BY published_at DESC`,
            { user_id: userId, include_hidden: includeHidden ? 1 : 0 },
        );
        return (result.rows || []).map(card);
    });
}

export async function getObserverPhotos(userId: number): Promise<PhotoCard[]> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT *
             FROM (
                 SELECT p.id,
                        p.user_id,
                        u.username,
                        NVL(u.avatar_url, '') AS avatar_url,
                        NVL(p.contents, '') AS caption,
                        TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at,
                        ROW_NUMBER() OVER (PARTITION BY f.user_id ORDER BY p.created_at DESC, p.id DESC) AS user_photo_order
                 FROM murm_friend f
                 JOIN murm_post p ON p.user_id = f.user_id
                 JOIN murm_user u ON u.id = f.user_id
                 WHERE f.friend_user_id = :user_id
                   AND f.status = 'A'
                   AND p.post_type = 'photo'
                   AND p.status = 'published'
             )
             WHERE user_photo_order = 1
               AND ROWNUM <= 8
             ORDER BY published_at DESC`,
            { user_id: userId },
        );
        return (result.rows || []).map(card);
    });
}

export async function getLatestPhotos(userId: number): Promise<PhotoCard[]> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT *
             FROM (
                 SELECT p.id,
                        p.user_id,
                        u.username,
                        NVL(u.avatar_url, '') AS avatar_url,
                        NVL(p.contents, '') AS caption,
                        TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at
                 FROM murm_post p
                 JOIN murm_user u ON u.id = p.user_id
                 WHERE p.user_id <> :user_id
                   AND p.post_type = 'photo'
                   AND p.status = 'published'
                 ORDER BY p.created_at DESC
             )
             WHERE ROWNUM <= 8`,
            { user_id: userId },
        );
        return (result.rows || []).map(card);
    });
}

export async function getComments(postId: number, viewerUserId: number, limit = 10, offset = 0): Promise<PhotoCommentsPage> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT id,
                    user_id,
                    username,
                    message,
                    created_at,
                    is_private,
                    can_read,
                    total
             FROM (
                 SELECT c.id,
                        c.user_id,
                        u.username,
                        CASE
                            WHEN NVL(c.visibility_code, 'public') = 'public'
                              OR c.user_id = :viewer_user_id
                              OR c.recipient_user_id = :viewer_user_id
                            THEN c.contents
                            ELSE NULL
                        END AS message,
                        TO_CHAR(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
                        CASE WHEN NVL(c.visibility_code, 'public') = 'private' THEN 1 ELSE 0 END AS is_private,
                        CASE
                            WHEN NVL(c.visibility_code, 'public') = 'public'
                              OR c.user_id = :viewer_user_id
                              OR c.recipient_user_id = :viewer_user_id
                            THEN 1
                            ELSE 0
                        END AS can_read,
                        COUNT(*) OVER () AS total,
                        ROW_NUMBER() OVER (ORDER BY c.created_at DESC, c.id DESC) AS row_number_value
                 FROM murm_post c
                 JOIN murm_user u ON u.id = c.user_id
                 WHERE c.parent_post_id = :post_id
                   AND c.post_type = 'comment'
                   AND c.status = 'published'
             )
             WHERE row_number_value > :comment_offset
               AND row_number_value <= :comment_offset + :comment_limit
             ORDER BY created_at, id`,
            {
                post_id: postId,
                viewer_user_id: viewerUserId,
                comment_offset: Math.max(0, offset),
                comment_limit: Math.max(1, Math.min(limit, 50)),
            },
        );
        const rows = result.rows || [];
        return {
            items: rows.map(row => ({
                id: Number(row.ID),
                userId: Number(row.USER_ID),
                username: String(row.USERNAME),
                message: String(row.MESSAGE || ''),
                createdAt: String(row.CREATED_AT),
                isPrivate: Number(row.IS_PRIVATE || 0) === 1,
                canRead: Number(row.CAN_READ || 0) === 1,
            })),
            total: Number(rows[0]?.TOTAL || 0),
        };
    });
}

export class PhotoLimitError extends Error {
    constructor(
        public readonly limit: number,
        public readonly intervalType: PhotoPostIntervalType,
        public readonly retryAfterSeconds: number,
    ) {
        super(`Limite de ${limit} foto(s) por ${intervalType} atingido.`);
        this.name = 'PhotoLimitError';
    }
}

export type SaveTodayPhotoInput = {
    userId: number;
    caption: string;
    filename: string;
    mimeType: string;
    image: Buffer;
};

type PhotoPostLimitConfig = {
    limit: number;
    intervalType: PhotoPostIntervalType;
};

type PhotoConnection = {
    execute<T = OracleRow>(sql: string, binds?: Record<string, unknown>): Promise<{
        rows?: T[];
        outBinds?: unknown;
    }>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
};

export function getPhotoPostLimitConfig(): PhotoPostLimitConfig {
    const runtimeLimit = process.env.PHOTO_POST_LIMIT ?? import.meta.env.PHOTO_POST_LIMIT;
    const runtimeInterval = process.env.PHOTO_POST_INTERVAL_TYPE ?? import.meta.env.PHOTO_POST_INTERVAL_TYPE;
    return {
        limit: normalizePhotoPostLimit(runtimeLimit, 1),
        intervalType: normalizePhotoPostIntervalType(runtimeInterval),
    };
}

export async function saveTodayPhotoWithConnection(
    connection: PhotoConnection,
    input: SaveTodayPhotoInput,
    config: PhotoPostLimitConfig,
): Promise<number> {
    const cutoffSql = getPhotoPostCutoffSql(config.intervalType);

    try {
        // Serializa publicações do mesmo usuário para impedir duas requisições simultâneas
        // de passarem pela contagem antes de qualquer uma inserir.
        await connection.execute(
            `SELECT id
             FROM murm_user
             WHERE id = :user_id
             FOR UPDATE`,
            { user_id: input.userId },
        );

        const limitResult = await connection.execute<OracleRow>(
            `SELECT COUNT(*) AS total
             FROM murm_post
             WHERE user_id = :user_id
               AND post_type = 'photo'
               AND status = 'published'
               AND created_at >= ${cutoffSql}`,
            { user_id: input.userId },
        );

        const total = Number(limitResult.rows?.[0]?.TOTAL || 0);

        console.info('[photo-limit-check]', {
            userId: input.userId,
            total,
            limit: config.limit,
            intervalType: config.intervalType,
            cutoffSql,
        });

        if (total >= config.limit) {
            throw new PhotoLimitError(config.limit, config.intervalType, getPhotoPostIntervalSeconds(config.intervalType));
        }

        const insertResult = await connection.execute(
            `INSERT INTO murm_post
                (user_id, contents, post_type, photo_day, image_blob, image_filename, image_mime_type)
             VALUES
                (:user_id, :contents, 'photo', TRUNC(CURRENT_DATE), :image_blob, :image_filename, :image_mime_type)
             RETURNING id INTO :id`,
            {
                user_id: input.userId,
                contents: input.caption || 'Foto',
                image_blob: { val: input.image, type: oracledb.BLOB },
                image_filename: input.filename,
                image_mime_type: input.mimeType,
                id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            },
        );

        await connection.commit();
        return Number((insertResult.outBinds as { id?: number[] } | undefined)?.id?.[0] || 0);
    } catch (error) {
        await connection.rollback();
        throw error;
    }
}

export async function saveTodayPhoto(input: SaveTodayPhotoInput): Promise<number> {
    const config = getPhotoPostLimitConfig();
    return withConnection(connection => saveTodayPhotoWithConnection(connection as PhotoConnection, input, config));
}

export async function addComment(
    postId: number,
    userId: number,
    message: string,
    isPrivate = false,
): Promise<number> {
    return withConnection(async connection => {
        try {
            const photoResult = await connection.execute<OracleRow>(
                `SELECT user_id
                   FROM murm_post
                  WHERE id = :post_id
                    AND post_type = 'photo'
                    AND status = 'published'`,
                { post_id: postId },
            );
            const ownerUserId = Number(photoResult.rows?.[0]?.USER_ID || 0);
            if (!ownerUserId) throw new Error('FOTO_INVALIDA');
            if (isPrivate && ownerUserId == userId) throw new Error('MENSAGEM_PRIVADA_INVALIDA');

            const result = await connection.execute(
                `INSERT INTO murm_post
                    (user_id, parent_post_id, recipient_user_id, contents, post_type, visibility_code)
                 VALUES
                    (:user_id, :post_id, :recipient_user_id, :contents, 'comment', :visibility_code)
                 RETURNING id INTO :comment_id`,
                {
                    post_id: postId,
                    user_id: userId,
                    recipient_user_id: isPrivate ? ownerUserId : null,
                    contents: message,
                    visibility_code: isPrivate ? 'private' : 'public',
                    comment_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                },
            );
            await connection.commit();
            const outBinds = result.outBinds as { comment_id?: number[] } | undefined;
            return Number(outBinds?.comment_id?.[0] || 0);
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
}

export async function deleteComment(commentId: number, userId: number): Promise<boolean> {
    return withConnection(async connection => {
        const result = await connection.execute(
            `UPDATE murm_post c
             SET c.status = 'deleted',
                 c.updated_at = SYSTIMESTAMP
             WHERE c.id = :comment_id
               AND c.post_type = 'comment'
               AND c.status = 'published'
               AND (
                    c.user_id = :user_id
                    OR EXISTS (
                        SELECT 1
                        FROM murm_post p
                        WHERE p.id = c.parent_post_id
                          AND p.user_id = :user_id
                          AND p.post_type = 'photo'
                    )
               )`,
            { comment_id: commentId, user_id: userId },
            { autoCommit: true },
        );
        return Number(result.rowsAffected || 0) > 0;
    });
}

export async function restoreComment(commentId: number, userId: number): Promise<boolean> {
    return withConnection(async connection => {
        const result = await connection.execute(
            `UPDATE murm_post c
             SET c.status = 'published',
                 c.updated_at = SYSTIMESTAMP
             WHERE c.id = :comment_id
               AND c.post_type = 'comment'
               AND c.status = 'deleted'
               AND c.updated_at >= SYSTIMESTAMP - NUMTODSINTERVAL(30, 'SECOND')
               AND (
                    c.user_id = :user_id
                    OR EXISTS (
                        SELECT 1
                        FROM murm_post p
                        WHERE p.id = c.parent_post_id
                          AND p.user_id = :user_id
                          AND p.post_type = 'photo'
                    )
               )`,
            { comment_id: commentId, user_id: userId },
            { autoCommit: true },
        );
        return Number(result.rowsAffected || 0) > 0;
    });
}

export async function getPhotoImage(postId: number): Promise<{ data: Buffer; mimeType: string } | null> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT image_blob,
                    image_mime_type
             FROM murm_post
             WHERE id = :id
               AND post_type = 'photo'
               AND status = 'published'`,
            { id: postId },
            { fetchInfo: { IMAGE_BLOB: { type: oracledb.BUFFER } } },
        );
        const row = result.rows?.[0];
        if (!row?.IMAGE_BLOB) return null;
        return { data: row.IMAGE_BLOB as Buffer, mimeType: String(row.IMAGE_MIME_TYPE || 'image/jpeg') };
    });
}


export type PublicProfile = {
    id: number;
    username: string;
    bio: string;
    avatarUrl: string;
    sexCode: '' | 'M' | 'F';
    observerVisibility: 'public' | 'private';
};

export async function updatePhotoCaption(postId: number, userId: number, caption: string): Promise<boolean> {
    return withConnection(async connection => {
        const result = await connection.execute(
            `UPDATE murm_post
             SET contents = :caption,
                 updated_at = SYSTIMESTAMP
             WHERE id = :id
               AND user_id = :user_id
               AND post_type = 'photo'
               AND status = 'published'`,
            { id: postId, user_id: userId, caption },
            { autoCommit: true },
        );
        return Number(result.rowsAffected || 0) > 0;
    });
}

export async function deletePhoto(postId: number, userId: number): Promise<boolean> {
    return withConnection(async connection => {
        const result = await connection.execute(
            `UPDATE murm_post
             SET status = 'deleted',
                 updated_at = SYSTIMESTAMP
             WHERE id = :id
               AND user_id = :user_id
               AND post_type = 'photo'
               AND status = 'published'`,
            { id: postId, user_id: userId },
            { autoCommit: true },
        );
        return Number(result.rowsAffected || 0) > 0;
    });
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT id,
                    username,
                    NVL(bio, '') AS bio,
                    NVL(avatar_url, '') AS avatar_url,
                    NVL(sex_code, '') AS sex_code,
                    NVL(observer_visibility_code, 'public') AS observer_visibility_code
             FROM murm_user
             WHERE LOWER(username) = LOWER(:username)
               AND active = 1`,
            { username },
        );
        const row = result.rows?.[0];
        if (!row) return null;
        return {
            id: Number(row.ID),
            username: String(row.USERNAME),
            bio: String(row.BIO || ''),
            avatarUrl: String(row.AVATAR_URL || ''),
            sexCode: normalizeSexCode(row.SEX_CODE),
            observerVisibility: String(row.OBSERVER_VISIBILITY_CODE || 'public') === 'private' ? 'private' : 'public',
        };
    });
}

export async function getUserPhotos(username: string): Promise<PhotoCard[]> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT p.id,
                    p.user_id,
                    u.username,
                    NVL(u.avatar_url, '') AS avatar_url,
                    NVL(p.contents, '') AS caption,
                    TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at
             FROM murm_post p
             JOIN murm_user u ON u.id = p.user_id
             WHERE LOWER(u.username) = LOWER(:username)
               AND u.active = 1
               AND p.post_type = 'photo'
               AND p.status = 'published'
             ORDER BY p.photo_day DESC, p.created_at DESC`,
            { username },
        );
        return (result.rows || []).map(card);
    });
}

export async function getFeedPhotos(limit = 20, offset = 0): Promise<PhotoCard[]> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT id,
                    user_id,
                    username,
                    avatar_url,
                    caption,
                    published_at
             FROM (
                 SELECT p.id,
                        p.user_id,
                        u.username,
                        NVL(u.avatar_url, '') AS avatar_url,
                        NVL(p.contents, '') AS caption,
                        TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at,
                        ROW_NUMBER() OVER (ORDER BY p.created_at DESC) AS row_number_value
                 FROM murm_post p
                 JOIN murm_user u ON u.id = p.user_id
                 WHERE p.post_type = 'photo'
                   AND p.status = 'published'
             )
             WHERE row_number_value > :photo_offset
               AND row_number_value <= :photo_offset + :photo_limit
             ORDER BY row_number_value`,
            {
                photo_offset: Math.max(0, offset),
                photo_limit: Math.max(1, Math.min(limit, 20)),
            },
        );
        return (result.rows || []).map(card);
    });
}

export async function getUserLatestPhoto(username: string): Promise<PhotoCard | null> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT *
             FROM (
                 SELECT p.id,
                        p.user_id,
                        u.username,
                        NVL(u.avatar_url, '') AS avatar_url,
                        NVL(p.contents, '') AS caption,
                        TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at
                 FROM murm_post p
                 JOIN murm_user u ON u.id = p.user_id
                 WHERE LOWER(u.username) = LOWER(:username)
                   AND p.post_type = 'photo'
                   AND p.status = 'published'
                 ORDER BY p.photo_day DESC, p.created_at DESC
             )
             WHERE ROWNUM = 1`,
            { username },
        );
        return result.rows?.[0] ? card(result.rows[0]) : null;
    });
}


export async function isFriend(userId: number, friendUserId: number): Promise<boolean> {
    return withConnection(async connection => {
        const result = await connection.execute<OracleRow>(
            `SELECT 1 AS found
             FROM murm_friend
             WHERE user_id = :user_id
               AND friend_user_id = :friend_user_id
               AND status = 'A'`,
            { user_id: userId, friend_user_id: friendUserId },
        );
        return Boolean(result.rows?.[0]);
    });
}

type FriendRemovalConnection = {
    execute: (
        sql: string,
        binds: Record<string, number>,
    ) => Promise<{ rowsAffected?: number }>;
};

export async function removeFriendWithConnection(
    connection: FriendRemovalConnection,
    userId: number,
    friendUserId: number,
): Promise<boolean> {
    if (userId === friendUserId) throw new Error('AMIGO_INVALIDO');

    const result = await connection.execute(
        `DELETE FROM murm_friend
         WHERE user_id = :user_id
           AND friend_user_id = :friend_user_id`,
        { user_id: userId, friend_user_id: friendUserId },
    );

    return Number(result.rowsAffected || 0) > 0;
}

export async function removeFriend(userId: number, friendUserId: number): Promise<boolean> {
    return withConnection(async connection => {
        try {
            const removed = await removeFriendWithConnection(connection, userId, friendUserId);
            await connection.commit();
            return removed;
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
}

export async function addFriend(userId: number, friendUserId: number): Promise<void> {
    if (userId === friendUserId) throw new Error('AMIGO_INVALIDO');

    await withConnection(async connection => {
        await connection.execute(
            `MERGE INTO murm_friend f
             USING (
                 SELECT :user_id AS user_id,
                        :friend_user_id AS friend_user_id
                 FROM dual
             ) x
             ON (
                 f.user_id = x.user_id
                 AND f.friend_user_id = x.friend_user_id
             )
             WHEN MATCHED THEN UPDATE SET
                 f.status = 'A'
             WHEN NOT MATCHED THEN INSERT
                 (user_id, friend_user_id, status)
             VALUES
                 (:user_id, :friend_user_id, 'A')`,
            { user_id: userId, friend_user_id: friendUserId },
            { autoCommit: true },
        );
    });
}

export async function addPrivatePhotoPost(input: {
    photoId: number;
    senderUserId: number;
    recipientUserId: number;
    message: string;
}): Promise<number> {
    return withConnection(async connection => {
        try {
            const photoResult = await connection.execute<OracleRow>(
                `SELECT user_id
                   FROM murm_post
                  WHERE id = :photo_id
                    AND post_type = 'photo'
                    AND status = 'published'`,
                { photo_id: input.photoId },
            );
            const ownerUserId = Number(photoResult.rows?.[0]?.USER_ID || 0);
            if (!ownerUserId || ownerUserId !== input.recipientUserId || ownerUserId === input.senderUserId) {
                throw new Error('MENSAGEM_PRIVADA_INVALIDA');
            }

            const result = await connection.execute(
                `INSERT INTO murm_post
                    (user_id, parent_post_id, recipient_user_id, contents, post_type, visibility_code)
                 VALUES
                    (:sender_user_id, :photo_id, :recipient_user_id, :contents, 'comment', 'private')
                 RETURNING id INTO :post_id`,
                {
                    sender_user_id: input.senderUserId,
                    photo_id: input.photoId,
                    recipient_user_id: input.recipientUserId,
                    contents: input.message,
                    post_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                },
            );
            await connection.commit();
            const outBinds = result.outBinds as { post_id?: number[] } | undefined;
            return Number(outBinds?.post_id?.[0] || 0);
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    });
}
