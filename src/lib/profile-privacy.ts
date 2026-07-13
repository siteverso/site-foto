export type ProfileVisibility = 'public' | 'unlisted' | 'private' | 'deleted';
export type ProfileBlockLevel = 'all' | 'messages';
export type ProfileBlockInput = { userId: number; level: ProfileBlockLevel; blocked: boolean };

export function normalizeProfileVisibility(value: unknown): ProfileVisibility {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'unlisted' || normalized === 'private' || normalized === 'deleted' ? normalized : 'public';
}

export function normalizeProfileBlockLevel(value: unknown): ProfileBlockLevel {
  return String(value || '').trim().toLowerCase() === 'messages' ? 'messages' : 'all';
}

export function parseProfileBlockInput(value: unknown): ProfileBlockInput {
  if (!value || typeof value !== 'object') throw new Error('REQUISICAO_INVALIDA');
  const input = value as Record<string, unknown>;
  const userId = Number(input.userId);
  const level = String(input.level || '').trim().toLowerCase();

  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error('USUARIO_ALVO_INVALIDO');
  if (level !== 'all' && level !== 'messages') throw new Error('NIVEL_BLOQUEIO_INVALIDO');
  if (typeof input.blocked !== 'boolean') throw new Error('ESTADO_BLOQUEIO_INVALIDO');

  return { userId, level, blocked: input.blocked };
}
