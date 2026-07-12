import type { APIRoute } from 'astro';
import { normalizePhotoId, normalizePrivatePhotoMessage } from '../../../lib/private-photo-message';
import { body, errorResponse, json } from '../../../lib/server/http';
import { addPrivatePhotoPost } from '../../../lib/server/repositories/photos';
import { requireUser } from '../../../lib/server/session';

export const POST: APIRoute = async context => {
    try {
        const user = await requireUser(context);
        const input = await body<{ photoId?: unknown; recipientId?: unknown; message?: unknown }>(context.request);
        const photoId = normalizePhotoId(input.photoId);
        const recipientId = Number(input.recipientId);
        if (!Number.isInteger(recipientId) || recipientId <= 0) throw new Error('USUARIO_INVALIDO');
        const message = normalizePrivatePhotoMessage(input.message);
        const id = await addPrivatePhotoPost({ photoId, senderUserId: user.id, recipientUserId: recipientId, message });
        return json({ ok: true, id }, 201);
    } catch (error) {
        return errorResponse(error);
    }
};
