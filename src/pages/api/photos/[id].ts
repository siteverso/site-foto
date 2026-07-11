import type { APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { deletePhoto, getPhotoImage } from '../../../lib/server/repositories/photos';

export const GET: APIRoute = async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) return new Response('Foto inválida', { status: 400 });

    const photo = await getPhotoImage(id);
    if (!photo) return new Response('Foto não encontrada', { status: 404 });

    return new Response(photo.data, {
        headers: {
            'Content-Type': photo.mimeType,
            'Cache-Control': 'public, max-age=3600',
        },
    });
};

export const DELETE: APIRoute = async context => {
    const user = await currentUser(context);
    if (!user) return new Response('Não autorizado', { status: 401 });

    const id = Number(context.params.id);
    if (!Number.isInteger(id) || id <= 0) return new Response('Foto inválida', { status: 400 });

    const deleted = await deletePhoto(id, user.id);
    if (!deleted) return new Response('Foto não encontrada ou sem permissão', { status: 404 });

    return Response.json({ ok: true });
};
