import type { APIRoute } from 'astro';
import { currentUser } from '../../../lib/server/session';
import { deleteComment, restoreComment } from '../../../lib/server/repositories/photos';

function commentId(value: string | undefined): number {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : 0;
}

export const DELETE: APIRoute = async context => {
    const user = await currentUser(context);
    if (!user) return Response.json({ ok: false, error: 'Faça login para excluir a mensagem.' }, { status: 401 });

    const id = commentId(context.params.id);
    if (!id) return Response.json({ ok: false, error: 'Mensagem inválida.' }, { status: 400 });

    const deleted = await deleteComment(id, user.id);
    if (!deleted) return Response.json({ ok: false, error: 'Você não pode excluir esta mensagem.' }, { status: 403 });
    return Response.json({ ok: true });
};

export const PATCH: APIRoute = async context => {
    const user = await currentUser(context);
    if (!user) return Response.json({ ok: false, error: 'Faça login para restaurar a mensagem.' }, { status: 401 });

    const id = commentId(context.params.id);
    if (!id) return Response.json({ ok: false, error: 'Mensagem inválida.' }, { status: 400 });

    const restored = await restoreComment(id, user.id);
    if (!restored) return Response.json({ ok: false, error: 'O prazo para desfazer terminou.' }, { status: 409 });
    return Response.json({ ok: true });
};
