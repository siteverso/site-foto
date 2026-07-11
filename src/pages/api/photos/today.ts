import type { APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { saveTodayPhoto } from '../../../lib/server/repositories/photos';

export const POST: APIRoute = async context => {
    const user = await currentUser(context);
    if (!user) return new Response('Não autorizado', { status: 401 });

    const form = await context.request.formData();
    const file = form.get('photo');
    const caption = String(form.get('caption') || '').trim().slice(0, 1000);

    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        return new Response('Imagem inválida', { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
        return new Response('Imagem maior que 10 MB', { status: 400 });
    }

    await saveTodayPhoto({
        userId: user.id,
        caption,
        filename: file.name,
        mimeType: file.type,
        image: Buffer.from(await file.arrayBuffer()),
    });

    return Response.json({ ok: true });
};
