import { describe, expect, it } from 'vitest';
import { normalizeProfileBlockLevel, parseProfileBlockInput } from '../src/lib/profile-privacy';

describe('profile block levels', () => {
  it.each(['messages', 'profile', 'all'] as const)('accepts %s', level => {
    expect(normalizeProfileBlockLevel(level)).toBe(level);
    expect(parseProfileBlockInput({ userId: 8, level, blocked: true })).toEqual({ userId: 8, level, blocked: true });
  });

  it('rejects unknown levels', () => {
    expect(() => parseProfileBlockInput({ userId: 8, level: 'other', blocked: true })).toThrow('NIVEL_BLOQUEIO_INVALIDO');
  });
});
