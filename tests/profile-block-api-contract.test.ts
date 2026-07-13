import { describe, expect, it } from 'vitest';
import { parseProfileBlockInput } from '../src/lib/profile-privacy';

describe('profile block API contract', () => {
  it.each(['messages', 'profile_access', 'hide_me', 'hide_them'] as const)('accepts %s', type => {
    expect(parseProfileBlockInput({ userId: 12, type, blocked: true })).toEqual({ userId: 12, type, blocked: true });
  });

  it.each([
    [{ userId: 0, type: 'messages', blocked: true }, 'USUARIO_ALVO_INVALIDO'],
    [{ userId: 12, type: 'x', blocked: true }, 'TIPO_BLOQUEIO_INVALIDO'],
    [{ userId: 12, type: 'messages', blocked: 'true' }, 'ESTADO_BLOQUEIO_INVALIDO'],
  ])('rejects invalid payload %#', (payload, code) => {
    expect(() => parseProfileBlockInput(payload)).toThrow(code);
  });
});
