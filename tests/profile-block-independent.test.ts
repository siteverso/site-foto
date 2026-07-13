import { describe, expect, it } from 'vitest';
import { parseProfileBlockInput } from '../src/lib/profile-privacy';

describe('independent profile blocks', () => {
  it.each(['messages', 'profile_access', 'hide_me', 'hide_them'] as const)('accepts %s independently', type => {
    expect(parseProfileBlockInput({ userId: 8, type, blocked: true })).toEqual({ userId: 8, type, blocked: true });
  });

  it('rejects an unknown block type', () => {
    expect(() => parseProfileBlockInput({ userId: 8, type: 'all', blocked: true })).toThrow('TIPO_BLOQUEIO_INVALIDO');
  });
});
