import { describe, expect, it } from 'vitest';
import {
    getPhotoPostCutoffSql,
    getPhotoPostIntervalLabel,
    normalizePhotoPostIntervalType,
    normalizePhotoPostLimit,
} from '../src/lib/photo-post-limit';

describe('photo post limit configuration', () => {
    it('aceita os cinco tipos de intervalo e usa dia como fallback seguro', () => {
        expect(normalizePhotoPostIntervalType(' minute ')).toBe('minute');
        expect(normalizePhotoPostIntervalType('HOUR')).toBe('hour');
        expect(normalizePhotoPostIntervalType('day')).toBe('day');
        expect(normalizePhotoPostIntervalType('week')).toBe('week');
        expect(normalizePhotoPostIntervalType('month')).toBe('month');
        expect(normalizePhotoPostIntervalType('undefined')).toBe('day');
    });

    it('normaliza o limite e evita zero, NaN e valores negativos', () => {
        expect(normalizePhotoPostLimit('2')).toBe(2);
        expect(normalizePhotoPostLimit('0', 3)).toBe(3);
        expect(normalizePhotoPostLimit('abc', 3)).toBe(3);
    });

    it('gera textos naturais e SQL fechado por tipo validado', () => {
        expect(getPhotoPostIntervalLabel('minute')).toBe('minuto');
        expect(getPhotoPostIntervalLabel('month')).toBe('mês');
        expect(getPhotoPostCutoffSql('week')).toContain("INTERVAL '7' DAY");
        expect(getPhotoPostCutoffSql('month')).toContain('ADD_MONTHS');
        expect(getPhotoPostCutoffSql('minute')).toContain('SYS_EXTRACT_UTC(SYSTIMESTAMP)');
    });
});
