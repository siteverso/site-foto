import { describe, expect, it } from 'vitest';
import { parseProfileBlockInput } from '../src/lib/profile-privacy';

describe('profile block API contract', () => {
  it('accepts a valid message block', () => {
    expect(parseProfileBlockInput({ userId: 12, level: 'messages', blocked: true }))
      .toEqual({ userId: 12, level: 'messages', blocked: true });
  });

  it('accepts a valid full unblock', () => {
    expect(parseProfileBlockInput({ userId: 12, level: 'all', blocked: false }))
      .toEqual({ userId: 12, level: 'all', blocked: false });
  });

  it.each([
    [{ userId: 0, level: 'all', blocked: true }, 'USUARIO_ALVO_INVALIDO'],
    [{ userId: 12, level: 'x', blocked: true }, 'NIVEL_BLOQUEIO_INVALIDO'],
    [{ userId: 12, level: 'all', blocked: 'true' }, 'ESTADO_BLOQUEIO_INVALIDO'],
  ])('rejects invalid payload %#', (payload, code) => {
    expect(() => parseProfileBlockInput(payload)).toThrow(code);
  });
});
