import { Buffer } from 'node:buffer';
import type { APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { stagePhotoUpload } from '../../../lib/server/photo-upload';

export const POST: APIRoute = async context => {
    const user = await currentUser(context);
    if (!user) return new Response('Não autorizado', { status: 401 });

    const form = await context.request.formData();
    const file = form.get('photo');

    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        return new Response('Imagem inválida', { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
        return new Response('Imagem maior que 10 MB', { status: 400 });
    }

    const uploadToken = await stagePhotoUpload({
        userId: user.id,
        filename: file.name,
        mimeType: file.type,
        image: Buffer.from(await file.arrayBuffer()),
    });

    return Response.json({ ok: true, uploadToken });
};
