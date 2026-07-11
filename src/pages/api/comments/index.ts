import type { APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { addComment, getComments } from '../../../lib/server/repositories/photos';
import { MESSAGE_MAX_LENGTH, validateMessageLength } from '../../../lib/message-limit';

export const GET: APIRoute = async context => {
    if (!await currentUser(context)) return new Response('Não autorizado', { status: 401 });
    const url = new URL(context.request.url);
    const postId = Number(url.searchParams.get('postId'));
    const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0);
    if (!Number.isInteger(postId) || postId <= 0) return new Response('Foto inválida', { status: 400 });
    return Response.json(await getComments(postId, 20, offset));
};

export const POST: APIRoute = async context => {
    const user = await currentUser(context);
    if (!user) return new Response('Não autorizado', { status: 401 });
    const body = await context.request.json().catch(() => ({}));
    const postId = Number(body.postId);
    let message = '';
    try {
        message = validateMessageLength(body.message);
    } catch (error) {
        return Response.json({ ok: false, error: error instanceof Error ? error.message : `A mensagem deve ter no máximo ${MESSAGE_MAX_LENGTH} caracteres.` }, { status: 400 });
    }
    if (!Number.isInteger(postId) || !message) return Response.json({ ok: false, error: 'Escreva uma mensagem antes de enviar.' }, { status: 400 });
    const id = await addComment(postId, user.id, message);
    return Response.json({ ok: true, comment: { id, userId: user.id, username: user.username, message, createdAt: new Date().toISOString() } });
};
