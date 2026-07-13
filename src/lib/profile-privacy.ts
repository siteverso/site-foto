export type ProfileVisibility = 'public' | 'unlisted' | 'private' | 'deleted';
export type ProfileBlockType = 'messages' | 'profile_access' | 'hide_me' | 'hide_them';
export type ProfileBlockInput = { userId: number; type: ProfileBlockType; blocked: boolean };

export function normalizeProfileVisibility(value: unknown): ProfileVisibility {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'unlisted' || normalized === 'private' || normalized === 'deleted' ? normalized : 'public';
}

export function normalizeProfileBlockType(value: unknown): ProfileBlockType {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'messages' || normalized === 'profile_access' || normalized === 'hide_me' || normalized === 'hide_them') return normalized;
  throw new Error('TIPO_BLOQUEIO_INVALIDO');
}

export function parseProfileBlockInput(value: unknown): ProfileBlockInput {
  if (!value || typeof value !== 'object') throw new Error('REQUISICAO_INVALIDA');
  const input = value as Record<string, unknown>;
  const userId = Number(input.userId);
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error('USUARIO_ALVO_INVALIDO');
  if (typeof input.blocked !== 'boolean') throw new Error('ESTADO_BLOQUEIO_INVALIDO');
  const type = normalizeProfileBlockType(input.type ?? input.level);

  return { userId, type, blocked: input.blocked };
}
