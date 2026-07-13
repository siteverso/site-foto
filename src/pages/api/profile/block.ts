import type { APIRoute } from 'astro';
import { body, errorResponse, json } from '../../../lib/server/http';
import { requireUser } from '../../../lib/server/session';
import { getBlockState, setProfileBlock } from '../../../lib/server/repositories/profile-privacy';
import { parseProfileBlockInput } from '../../../lib/profile-privacy';

type Ctx = Parameters<APIRoute>[0];

export async function GET(context: Ctx) {
  try {
    const user = await requireUser(context);
    const target = Number(new URL(context.request.url).searchParams.get('userId'));
    if (!Number.isSafeInteger(target) || target <= 0 || target === user.id) {
      throw new Error('USUARIO_ALVO_INVALIDO');
    }
    return json({ ok: true, block: await getBlockState(user.id, target) });
  } catch (error) {
    return errorResponse(error);
  }
}

async function updateBlock(context: Ctx) {
  try {
    const user = await requireUser(context);
    const input = parseProfileBlockInput(await body<unknown>(context.request));
    if (input.userId === user.id) throw new Error('BLOQUEIO_INVALIDO');

    await setProfileBlock(user.id, input.userId, input.type, input.blocked);
    return json({ ok: true, block: await getBlockState(user.id, input.userId) });
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH é o contrato principal. POST é mantido como compatibilidade para testes,
// proxies e clientes que não encaminham PATCH corretamente.
export const PATCH: APIRoute = updateBlock;
export const POST: APIRoute = updateBlock;
