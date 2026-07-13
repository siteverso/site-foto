import { withConnection } from '../oracle';

type Row = Record<string, unknown> & {
  ID?: unknown; PHOTO_ID?: unknown; MESSAGE?: unknown; CREATED_AT?: unknown;
  VISIBILITY_CODE?: unknown; SENDER_USER_ID?: unknown; SENDER_USERNAME?: unknown;
  SENDER_AVATAR_URL?: unknown; PHOTO_CAPTION?: unknown;
};

export type ReceivedPhotoMessage = {
  id: number;
  photoId: number;
  message: string;
  createdAt: string;
  visibility: 'public' | 'private';
  sender: { id: number; username: string; avatarUrl: string };
  photo: { caption: string };
};

export async function getReceivedPhotoMessages(ownerUserId: number, limit = 200): Promise<ReceivedPhotoMessage[]> {
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT c.id,
              p.id AS photo_id,
              c.contents AS message,
              TO_CHAR(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
              NVL(c.visibility_code, 'public') AS visibility_code,
              u.id AS sender_user_id,
              u.username AS sender_username,
              NVL(u.avatar_url, '') AS sender_avatar_url,
              NVL(p.contents, '') AS photo_caption
         FROM murm_post c
         JOIN murm_post p
           ON p.id = c.parent_post_id
          AND p.post_type = 'photo'
          AND p.status = 'published'
         JOIN murm_user u
           ON u.id = c.user_id
          AND u.active = 1
        WHERE p.user_id = :owner_user_id
          AND c.post_type = 'comment'
          AND c.status = 'published'
          AND c.user_id <> :owner_user_id
          AND NVL(c.visibility_code, 'public') IN ('public', 'private')
        ORDER BY c.created_at DESC, c.id DESC
        FETCH FIRST :fetch_limit ROWS ONLY`,
      { owner_user_id: ownerUserId, fetch_limit: Math.max(1, Math.min(limit, 500)) },
    );

    return (result.rows || []).map(row => ({
      id: Number(row.ID),
      photoId: Number(row.PHOTO_ID),
      message: String(row.MESSAGE || ''),
      createdAt: String(row.CREATED_AT || ''),
      visibility: String(row.VISIBILITY_CODE) === 'private' ? 'private' : 'public',
      sender: {
        id: Number(row.SENDER_USER_ID),
        username: String(row.SENDER_USERNAME || ''),
        avatarUrl: String(row.SENDER_AVATAR_URL || ''),
      },
      photo: { caption: String(row.PHOTO_CAPTION || '') },
    }));
  });
}
