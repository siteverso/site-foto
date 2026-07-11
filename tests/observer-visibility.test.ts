import { describe, expect, it } from 'vitest';
import { canViewObservedList, normalizeObserverVisibility } from '../src/lib/observer-visibility';

describe('normalizeObserverVisibility', () => {
    it('aceita somente as opções persistidas pelo sistema', () => {
        expect(normalizeObserverVisibility('public')).toBe('public');
        expect(normalizeObserverVisibility(' PRIVATE ')).toBe('private');
    });

    it('rejeita valores desconhecidos', () => {
        expect(() => normalizeObserverVisibility('friends')).toThrow('VISIBILIDADE_OBSERVADOS_INVALIDA');
    });
});

describe('canViewObservedList', () => {
    it('sempre permite que o proprietário veja a própria lista', () => {
        expect(canViewObservedList(10, 10, 'private')).toBe(true);
    });

    it('respeita a privacidade para outros usuários', () => {
        expect(canViewObservedList(10, 20, 'public')).toBe(true);
        expect(canViewObservedList(10, 20, 'private')).toBe(false);
    });
});
