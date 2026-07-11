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
                    NVL(p.caption, '') AS caption,
                    TO_CHAR(p.published_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at
             FROM foto_post p
             JOIN murm_user u ON u.id = p.user_id
             WHERE p.user_id = :user_id
               AND p.photo_day = TRUNC(CURRENT_DATE)`,
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
                        NVL(p.caption, '') AS caption,
                        TO_CHAR(p.published_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at
                 FROM foto_friend f
                 JOIN foto_post p ON p.user_id = f.friend_user_id
                 JOIN murm_user u ON u.id = p.user_id
                 WHERE f.user_id = :user_id
                   AND f.status = 'A'
                 ORDER BY p.published_at DESC
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
                        NVL(p.caption, '') AS caption,
                        TO_CHAR(p.published_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS published_at
                 FROM foto_post p
                 JOIN murm_user u ON u.id = p.user_id
                 WHERE p.user_id <> :user_id
                 ORDER BY p.published_at DESC
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
                    u.username,
                    c.message,
                    TO_CHAR(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
             FROM foto_comment c
             JOIN murm_user u ON u.id = c.user_id
             WHERE c.post_id = :post_id
             ORDER BY c.created_at`,
            { post_id: postId },
        );
        return (result.rows || []).map(row => ({
            id: Number(row.ID),
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
            `MERGE INTO foto_post p
             USING (SELECT :user_id AS user_id, TRUNC(CURRENT_DATE) AS photo_day FROM dual) x
             ON (p.user_id = x.user_id AND p.photo_day = x.photo_day)
             WHEN MATCHED THEN UPDATE SET
                 p.caption = :caption,
                 p.image_blob = :image_blob,
                 p.image_filename = :image_filename,
                 p.image_mime_type = :image_mime_type,
                 p.updated_at = SYSTIMESTAMP
             WHEN NOT MATCHED THEN INSERT
                 (user_id, photo_day, caption, image_blob, image_filename, image_mime_type)
             VALUES
                 (:user_id, TRUNC(CURRENT_DATE), :caption, :image_blob, :image_filename, :image_mime_type)`,
            {
                user_id: input.userId,
                caption: input.caption || null,
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
            `INSERT INTO foto_comment (post_id, user_id, message)
             VALUES (:post_id, :user_id, :message)`,
            { post_id: postId, user_id: userId, message },
            { autoCommit: true },
        );
    });
}

export async function getPhotoImage(postId: number): Promise<{ data: Buffer; mimeType: string } | null> {
    return withConnection(async connection => {
        const result = await connection.execute<Record<string, unknown>>(
            `SELECT image_blob, image_mime_type
             FROM foto_post
             WHERE id = :id`,
            { id: postId },
            { fetchInfo: { IMAGE_BLOB: { type: oracledb.BUFFER } } },
        );
        const row = result.rows?.[0];
        if (!row?.IMAGE_BLOB) return null;
        return { data: row.IMAGE_BLOB as Buffer, mimeType: String(row.IMAGE_MIME_TYPE || 'image/jpeg') };
    });
}
