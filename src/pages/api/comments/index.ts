import type { APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { addComment } from '../../../lib/server/repositories/photos';

export const POST: APIRoute = async context => {
    const user = await currentUser(context);
    if (!user) return new Response('Não autorizado', { status: 401 });
    const body = await context.request.json().catch(() => ({}));
    const postId = Number(body.postId);
    const message = String(body.message || '').trim().slice(0, 500);
    if (!Number.isInteger(postId) || !message) return new Response('Dados inválidos', { status: 400 });
    await addComment(postId, user.id, message);
    return Response.json({ ok: true });
};
