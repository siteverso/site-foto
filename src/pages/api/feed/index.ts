import type { APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { getFeedPhotos } from '../../../lib/server/repositories/photos';

export const GET: APIRoute = async context => {
    const user = await currentUser(context);
    if (!user) return new Response('Não autorizado', { status: 401 });

    const url = new URL(context.request.url);
    const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0);
    const items = await getFeedPhotos(user.id, 20, offset);

    return Response.json({ items, hasMore: items.length === 20 });
};
