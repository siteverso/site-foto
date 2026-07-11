import { describe, expect, it } from 'vitest';
import {
    canViewObservedList,
    normalizeHiddenObservedUserIds,
    normalizeObserverVisibility,
} from '../src/lib/observer-visibility';

describe('normalizeObserverVisibility', () => {
    it('aceita somente as opções persistidas pelo sistema', () => {
        expect(normalizeObserverVisibility('public')).toBe('public');
        expect(normalizeObserverVisibility(' PRIVATE ')).toBe('private');
    });

    it('rejeita valores desconhecidos', () => {
        expect(() => normalizeObserverVisibility('friends')).toThrow('VISIBILIDADE_OBSERVADOS_INVALIDA');
    });
});

describe('normalizeHiddenObservedUserIds', () => {
    it('normaliza, remove duplicados e descarta ids inválidos', () => {
        expect(normalizeHiddenObservedUserIds(['8', 3, 8, 0, -1, 'x'])).toEqual([3, 8]);
    });

    it('rejeita valores que não sejam lista', () => {
        expect(() => normalizeHiddenObservedUserIds('8')).toThrow('OBSERVADOS_OCULTOS_INVALIDOS');
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
