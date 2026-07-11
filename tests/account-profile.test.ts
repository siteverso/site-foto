import { describe, expect, it } from 'vitest';
import { normalizeSexCode } from '../src/lib/account-profile';

describe('normalizeSexCode', () => {
    it('normaliza as opções persistidas e permite não informar', () => {
        expect(normalizeSexCode(' m ')).toBe('M');
        expect(normalizeSexCode('F')).toBe('F');
        expect(normalizeSexCode('')).toBe('');
        expect(normalizeSexCode(null)).toBe('');
    });

    it('rejeita valores desconhecidos', () => {
        expect(() => normalizeSexCode('X')).toThrow('SEXO_INVALIDO');
    });
});
