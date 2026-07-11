import type { APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { addFriend, removeFriend } from '../../../lib/server/repositories/photos';

export const POST: APIRoute = async context => {
    const user = await currentUser(context);
    if (!user) return new Response('Não autorizado', { status: 401 });

    const friendUserId = Number(context.params.userId);
    if (!Number.isInteger(friendUserId) || friendUserId <= 0 || friendUserId === user.id) {
        return new Response('Usuário inválido', { status: 400 });
    }

    await addFriend(user.id, friendUserId);
    return Response.json({ ok: true });
};


export const DELETE: APIRoute = async context => {
    const user = await currentUser(context);
    if (!user) return new Response('Não autorizado', { status: 401 });

    const friendUserId = Number(context.params.userId);
    if (!Number.isInteger(friendUserId) || friendUserId <= 0 || friendUserId === user.id) {
        return new Response('Usuário inválido', { status: 400 });
    }

    const removed = await removeFriend(user.id, friendUserId);
    return Response.json({ ok: true, removed });
};
