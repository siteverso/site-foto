import { describe, expect, it } from 'vitest';
import { normalizeTheme, themeColorScheme } from '../src/lib/theme';

describe('temas do FotoLife', () => {
    it('restaura as quatro opções válidas', () => {
        expect(normalizeTheme('light')).toBe('light');
        expect(normalizeTheme(' LIGHT-WARM ')).toBe('light-warm');
        expect(normalizeTheme('dark')).toBe('dark');
        expect(normalizeTheme('dark-blue')).toBe('dark-blue');
    });

    it('usa o primeiro tema claro para valores ausentes ou inválidos', () => {
        expect(normalizeTheme(undefined)).toBe('light');
        expect(normalizeTheme('auto')).toBe('light');
    });

    it('informa o esquema de cor correto ao navegador', () => {
        expect(themeColorScheme('light')).toBe('light');
        expect(themeColorScheme('light-warm')).toBe('light');
        expect(themeColorScheme('dark')).toBe('dark');
        expect(themeColorScheme('dark-blue')).toBe('dark');
    });
});
