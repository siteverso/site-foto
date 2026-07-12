// noinspection SqlResolve
import oracledb from 'oracledb';
import { withConnection } from '../oracle';

type OracleRow = Record<string, unknown> & {
    ID?: unknown;
    PHOTO_POST_ID?: unknown;
    SENDER_USER_ID?: unknown;
    USERNAME?: unknown;
    MESSAGE?: unknown;
    CREATED_AT?: unknown;
};

export type PrivatePhotoMessage = {
    id: number;
    photoId: number;
    senderUserId: number;
    username: string;
    message: string;
    createdAt: string;
};

export async function getPrivatePhotoMessages(ownerUserId: number, photoIds: number[]): Promise<Map<number, PrivatePhotoMessage[]>> {
    const ids = [...new Set(photoIds.filter(id => Number.isInteger(id) && id > 0))];
    const messages = new Map<number, PrivatePhotoMessage[]>();
    ids.forEach(id => messages.set(id, []));
    if (!ids.length) return messages;

    return withConnection(async connection => {
        const binds: Record<string, number> = { owner_user_id: ownerUserId };
        const placeholders = ids.map((id, index) => {
            const name = `photo_id_${index}`;
            binds[name] = id;
            return `:${name}`;
        });
        const result = await connection.execute<OracleRow>(
            `SELECT m.id,
                    m.photo_post_id,
                    m.sender_user_id,
                    u.username,
                    m.message,
                    TO_CHAR(m.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
               FROM murm_photo_private_message m
               JOIN murm_post p ON p.id = m.photo_post_id
               JOIN murm_user u ON u.id = m.sender_user_id
              WHERE p.user_id = :owner_user_id
                AND p.post_type = 'photo'
                AND p.status = 'published'
                AND m.photo_post_id IN (${placeholders.join(', ')})
              ORDER BY m.created_at`,
            binds,
        );
        for (const row of result.rows || []) {
            const photoId = Number(row.PHOTO_POST_ID);
            const photoMessages = messages.get(photoId) || [];
            photoMessages.push({
                id: Number(row.ID),
                photoId,
                senderUserId: Number(row.SENDER_USER_ID),
                username: String(row.USERNAME),
                message: String(row.MESSAGE),
                createdAt: String(row.CREATED_AT),
            });
            messages.set(photoId, photoMessages);
        }
        return messages;
    });
}

export async function addPrivatePhotoMessage(input: {
    photoId: number;
    senderUserId: number;
    recipientUserId: number;
    message: string;
}): Promise<number> {
    if (input.senderUserId === input.recipientUserId) throw new Error('MENSAGEM_PRIVADA_INVALIDA');

    return withConnection(async connection => {
        const photo = await connection.execute<OracleRow>(
            `SELECT id
               FROM murm_post
              WHERE id = :photo_id
                AND user_id = :recipient_user_id
                AND post_type = 'photo'
                AND status = 'published'`,
            { photo_id: input.photoId, recipient_user_id: input.recipientUserId },
        );
        if (!photo.rows?.[0]) throw new Error('FOTO_INVALIDA');

        const result = await connection.execute(
            `INSERT INTO murm_photo_private_message
                (photo_post_id, sender_user_id, recipient_user_id, message)
             VALUES
                (:photo_id, :sender_user_id, :recipient_user_id, :message)
             RETURNING id INTO :message_id`,
            {
                photo_id: input.photoId,
                sender_user_id: input.senderUserId,
                recipient_user_id: input.recipientUserId,
                message: input.message,
                message_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            },
            { autoCommit: true },
        );
        return Number((result.outBinds as { message_id?: number[] } | undefined)?.message_id?.[0] || 0);
    });
}
