import type { APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { getComments, getFeedPhotos } from '../../../lib/server/repositories/photos';

export const GET: APIRoute = async context => {
    if (!await currentUser(context)) return new Response('Não autorizado', { status: 401 });

    const url = new URL(context.request.url);
    const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0);
    const photos = await getFeedPhotos(20, offset);
    const items = await Promise.all(photos.map(async photo => ({
        ...photo,
        comments: await getComments(photo.id, 10, 0),
    })));

    return Response.json({ items, hasMore: photos.length === 20 });
};
