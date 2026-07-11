import type { APIContext, APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { PhotoLimitError, saveTodayPhoto } from '../../../lib/server/repositories/photos';
import { readStagedPhoto, removeStagedPhoto } from '../../../lib/server/photo-upload';
import { validateMessageLength } from '../../../lib/message-limit';

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

    try {
        await saveTodayPhoto({
            userId: user.id,
            caption,
            filename: stagedPhoto.filename,
            mimeType: stagedPhoto.mimeType,
            image: stagedPhoto.image,
        });
        await removeStagedPhoto(uploadToken);
    } catch (error) {
        if (error instanceof PhotoLimitError) {
            const periodName = error.periodType === 'DAY'
                ? (error.periodAmount === 1 ? 'dia' : 'dias')
                : (error.periodAmount === 1 ? 'minuto' : 'minutos');
            const retryMinutes = Math.max(1, Math.ceil(error.retryAfterSeconds / 60));
            const retryText = retryMinutes >= 1440
                ? `${Math.ceil(retryMinutes / 1440)} dia(s)`
                : `${retryMinutes} minuto(s)`;

            return Response.json(
                {
                    ok: false,
                    error: `Você atingiu o limite de ${error.limit} foto(s) por ${error.periodAmount} ${periodName}. Tente novamente em aproximadamente ${retryText}.`,
                    limit: error.limit,
                    periodAmount: error.periodAmount,
                    periodType: error.periodType,
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

    return Response.json({ ok: true });
};
