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
  console.error('[PATCH /api/profile/block] erro completo:', error);

  if (error instanceof Error) {
    console.error('[PATCH /api/profile/block] mensagem:', error.message);
    console.error('[PATCH /api/profile/block] stack:', error.stack);
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: 'PROFILE_BLOCK_FAILED',
      message:
        import.meta.env.DEV && error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o bloqueio.',
      stack:
        import.meta.env.DEV && error instanceof Error
          ? error.stack
          : undefined
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
}

async function updateBlock(context: Ctx) {
  try {
    const user = await requireUser(context);
    const input = parseProfileBlockInput(await body<unknown>(context.request));
    if (input.userId === user.id) throw new Error('BLOQUEIO_INVALIDO');

    await setProfileBlock(user.id, input.userId, input.level, input.blocked);
    return json({ ok: true, block: await getBlockState(user.id, input.userId) });
  } catch (error) {
  console.error('[PATCH /api/profile/block] erro completo:', error);

  if (error instanceof Error) {
    console.error('[PATCH /api/profile/block] mensagem:', error.message);
    console.error('[PATCH /api/profile/block] stack:', error.stack);
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: 'PROFILE_BLOCK_FAILED',
      message:
        import.meta.env.DEV && error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o bloqueio.',
      stack:
        import.meta.env.DEV && error instanceof Error
          ? error.stack
          : undefined
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}
}

// PATCH é o contrato principal. POST é mantido como compatibilidade para testes,
// proxies e clientes que não encaminham PATCH corretamente.
export const PATCH: APIRoute = updateBlock;
export const POST: APIRoute = updateBlock;
