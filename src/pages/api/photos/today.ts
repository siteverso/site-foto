import type { APIContext, APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { PhotoLimitError, saveTodayPhoto } from '../../../lib/server/repositories/photos';
import { readStagedPhoto, removeStagedPhoto } from '../../../lib/server/photo-upload';
import { validateMessageLength } from '../../../lib/message-limit';
import { getPhotoPostIntervalLabel } from '../../../lib/photo-post-limit';

export const POST: APIRoute = async (context: APIContext) => {
    const user = await currentUser(context);
    if (!user) return new Response('Não autorizado', { status: 401 });

    const input = await context.request.json().catch(() => ({})) as {
        uploadToken?: string;
        caption?: string;
    };
    const uploadToken = String(input.uploadToken || '');
    let caption = '';
    try {
        caption = validateMessageLength(input.caption, 'A legenda');
    } catch (error) {
        return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Legenda inválida.' }, { status: 400 });
    }
    const stagedPhoto = await readStagedPhoto(uploadToken, user.id);

    if (!stagedPhoto) return new Response('Envio expirado ou inválido. Escolha a foto novamente.', { status: 400 });

    let photoId = 0;
    try {
        photoId = await saveTodayPhoto({
            userId: user.id,
            caption,
            filename: stagedPhoto.filename,
            mimeType: stagedPhoto.mimeType,
            image: stagedPhoto.image,
        });
        await removeStagedPhoto(uploadToken);
    } catch (error) {
        if (error instanceof PhotoLimitError) {
            const intervalLabel = getPhotoPostIntervalLabel(error.intervalType);
            return Response.json(
                {
                    ok: false,
                    error: `Limite de ${error.limit} foto(s) por ${intervalLabel}. Aguarde o fim desse intervalo após a última publicação.`,
                    limit: error.limit,
                    intervalType: error.intervalType,
                    retryAfterSeconds: error.retryAfterSeconds,
                },
                {
                    status: 429,
                    headers: { 'Retry-After': String(error.retryAfterSeconds) },
                },
            );
        }

        throw error;
    }

    return Response.json({ ok: true, photoId });
};
