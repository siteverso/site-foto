import type { APIRoute } from 'astro';
import { getPhotoImage } from '../../../lib/server/repositories/photos';

export const GET: APIRoute = async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return new Response('Inválido', { status: 400 });
    const image = await getPhotoImage(id);
    if (!image) return new Response('Não encontrada', { status: 404 });
    return new Response(image.data, {
        headers: {
            'Content-Type': image.mimeType,
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
