import { withConnection } from '../oracle';

type SentPhotoMessageRow = Record<string, unknown> & {
    ID?: unknown;
    PHOTO_ID?: unknown;
    MESSAGE?: unknown;
    CREATED_AT?: unknown;
    VISIBILITY_CODE?: unknown;
    RECIPIENT_USER_ID?: unknown;
    RECIPIENT_USERNAME?: unknown;
    RECIPIENT_AVATAR_URL?: unknown;
    PHOTO_CAPTION?: unknown;
    PHOTO_STATUS?: unknown;
};

export type SentPhotoMessage = {
    id: number;
    photoId: number;
    message: string;
    createdAt: string;
    visibility: 'public' | 'private';
    recipient: { id: number; username: string; avatarUrl: string };
    photo: { caption: string; available: boolean };
};

/**
 * Timeline privada do autor autenticado. O identificador vem exclusivamente da
 * sessão; a consulta reúne comentários públicos e mensagens privadas em posts.
 */
export async function getSentPhotoMessages(senderUserId: number): Promise<SentPhotoMessage[]> {
    return withConnection(async connection => {
        const result = await connection.execute<SentPhotoMessageRow>(
            `SELECT c.id,
                    NVL(photo.id, parent.id) AS photo_id,
                    c.contents AS message,
                    TO_CHAR(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
                    NVL(c.visibility_code, 'public') AS visibility_code,
                    recipient.id AS recipient_user_id,
                    recipient.username AS recipient_username,
                    NVL(recipient.avatar_url, '') AS recipient_avatar_url,
                    NVL(photo.contents, parent.contents) AS photo_caption,
                    NVL(photo.status, parent.status) AS photo_status
             FROM murm_post c
             JOIN murm_post parent
               ON parent.id = c.parent_post_id
             LEFT JOIN murm_post photo
               ON photo.id = CASE
                    WHEN parent.post_type = 'photo' THEN parent.id
                    ELSE parent.parent_post_id
                  END
              AND photo.post_type = 'photo'
             JOIN murm_user recipient
               ON recipient.id = NVL(c.recipient_user_id, parent.user_id)
              AND recipient.active = 1
             WHERE c.user_id = :sender_user_id
               AND c.parent_post_id IS NOT NULL
               AND c.status = 'published'
               AND NVL(c.visibility_code, 'public') IN ('public', 'private')
             ORDER BY c.created_at DESC, c.id DESC`,
            { sender_user_id: senderUserId },
        );

        return (result.rows || []).map(row => ({
            id: Number(row.ID),
            photoId: Number(row.PHOTO_ID),
            message: String(row.MESSAGE || ''),
            createdAt: String(row.CREATED_AT),
            visibility: String(row.VISIBILITY_CODE) === 'private' ? 'private' : 'public',
            recipient: {
                id: Number(row.RECIPIENT_USER_ID),
                username: String(row.RECIPIENT_USERNAME),
                avatarUrl: String(row.RECIPIENT_AVATAR_URL || ''),
            },
            photo: {
                caption: String(row.PHOTO_CAPTION || ''),
                available: String(row.PHOTO_STATUS) === 'published' && Number(row.PHOTO_ID) > 0,
            },
        }));
    });
}
