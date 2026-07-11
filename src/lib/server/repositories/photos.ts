import oracledb from 'oracledb';
import { withConnection } from '../oracle';

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
};

function card(row: Record<string, unknown>): PhotoCard {
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
        const result = await connection.execute<Record<string, unknown>>(
            `SELECT p.id,
                    p.user_id,
                    u.username,
                    NVL(u.avatar_url, '') AS avatar_url,
                    NVL(p.contents, '') AS caption,
                    TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at
             FROM murm_post p
             JOIN murm_user u ON u.id = p.user_id
             WHERE p.user_id = :user_id
               AND p.post_type = 'photo'
               AND p.photo_day = TRUNC(CURRENT_DATE)
               AND p.status = 'published'`,
            { user_id: userId },
        );
        return result.rows?.[0] ? card(result.rows[0]) : null;
    });
}

export async function getFriendPhotos(userId: number): Promise<PhotoCard[]> {
    return withConnection(async connection => {
        const result = await connection.execute<Record<string, unknown>>(
            `SELECT *
             FROM (
                 SELECT p.id,
                        p.user_id,
                        u.username,
                        NVL(u.avatar_url, '') AS avatar_url,
                        NVL(p.contents, '') AS caption,
                        TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at
                 FROM murm_friend f
                 JOIN murm_post p ON p.user_id = f.friend_user_id
                 JOIN murm_user u ON u.id = p.user_id
                 WHERE f.user_id = :user_id
                   AND f.status = 'A'
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

export async function getLatestPhotos(userId: number): Promise<PhotoCard[]> {
    return withConnection(async connection => {
        const result = await connection.execute<Record<string, unknown>>(
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

export async function getComments(postId: number): Promise<PhotoComment[]> {
    return withConnection(async connection => {
        const result = await connection.execute<Record<string, unknown>>(
            `SELECT c.id,
                    c.user_id,
                    u.username,
                    c.contents AS message,
                    TO_CHAR(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
             FROM murm_post c
             JOIN murm_user u ON u.id = c.user_id
             WHERE c.parent_post_id = :post_id
               AND c.post_type = 'comment'
               AND c.status = 'published'
             ORDER BY c.created_at`,
            { post_id: postId },
        );
        return (result.rows || []).map(row => ({
            id: Number(row.ID),
            userId: Number(row.USER_ID),
            username: String(row.USERNAME),
            message: String(row.MESSAGE),
            createdAt: String(row.CREATED_AT),
        }));
    });
}

export async function saveTodayPhoto(input: {
    userId: number;
    caption: string;
    filename: string;
    mimeType: string;
    image: Buffer;
}): Promise<void> {
    await withConnection(async connection => {
        await connection.execute(
            `MERGE INTO murm_post p
             USING (
                 SELECT :user_id AS user_id,
                        TRUNC(CURRENT_DATE) AS photo_day
                 FROM dual
             ) x
             ON (
                 p.user_id = x.user_id
                 AND p.post_type = 'photo'
                 AND p.photo_day = x.photo_day
             )
             WHEN MATCHED THEN UPDATE SET
                 p.contents = :contents,
                 p.image_blob = :image_blob,
                 p.image_filename = :image_filename,
                 p.image_mime_type = :image_mime_type,
                 p.status = 'published',
                 p.updated_at = SYSTIMESTAMP
             WHEN NOT MATCHED THEN INSERT
                 (user_id, contents, post_type, photo_day, image_blob, image_filename, image_mime_type)
             VALUES
                 (:user_id, :contents, 'photo', TRUNC(CURRENT_DATE), :image_blob, :image_filename, :image_mime_type)`,
            {
                user_id: input.userId,
                contents: input.caption || 'Foto do dia',
                image_blob: { val: input.image, type: oracledb.BLOB },
                image_filename: input.filename,
                image_mime_type: input.mimeType,
            },
            { autoCommit: true },
        );
    });
}

export async function addComment(postId: number, userId: number, message: string): Promise<void> {
    await withConnection(async connection => {
        await connection.execute(
            `INSERT INTO murm_post
                (user_id, parent_post_id, contents, post_type)
             VALUES
                (:user_id, :post_id, :contents, 'comment')`,
            { post_id: postId, user_id: userId, contents: message },
            { autoCommit: true },
        );
    });
}

export async function getPhotoImage(postId: number): Promise<{ data: Buffer; mimeType: string } | null> {
    return withConnection(async connection => {
        const result = await connection.execute<Record<string, unknown>>(
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
};

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
        const result = await connection.execute<Record<string, unknown>>(
            `SELECT id,
                    username,
                    NVL(bio, '') AS bio,
                    NVL(avatar_url, '') AS avatar_url
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
        };
    });
}

export async function getUserPhotos(username: string): Promise<PhotoCard[]> {
    return withConnection(async connection => {
        const result = await connection.execute<Record<string, unknown>>(
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

export async function getFeedPhotos(limit = 30): Promise<PhotoCard[]> {
    return withConnection(async connection => {
        const result = await connection.execute<Record<string, unknown>>(
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
                 WHERE p.post_type = 'photo'
                   AND p.status = 'published'
                 ORDER BY p.created_at DESC
             )
             WHERE ROWNUM <= :photo_limit`,
            { photo_limit: limit },
        );
        return (result.rows || []).map(card);
    });
}

export async function getUserLatestPhoto(username: string): Promise<PhotoCard | null> {
    return withConnection(async connection => {
        const result = await connection.execute<Record<string, unknown>>(
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
        const result = await connection.execute<Record<string, unknown>>(
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
        );

        await connection.execute(
            `MERGE INTO murm_friend f
             USING (
                 SELECT :friend_user_id AS user_id,
                        :user_id AS friend_user_id
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
                 (:friend_user_id, :user_id, 'A')`,
            { user_id: userId, friend_user_id: friendUserId },
            { autoCommit: true },
        );
    });
}
