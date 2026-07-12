import { describe, expect, it } from 'vitest';
import { getObservedSectionTitle, getObserverSectionTitle } from '../src/lib/profile-observer-copy';

describe('profile observer copy', () => {
    it('usa títulos próprios no meu perfil', () => {
        expect(getObserverSectionTitle(true, 'F')).toBe('Meus observadores');
        expect(getObserverSectionTitle(true, 'M')).toBe('Meus observadores');
        expect(getObservedSectionTitle(true, 'F')).toBe('Estou observando');
        expect(getObservedSectionTitle(true, 'M')).toBe('Estou observando');
    });

    it('usa pronomes femininos e masculinos quando o sexo do perfil é conhecido', () => {
        expect(getObserverSectionTitle(false, 'F')).toBe('Observando ela');
        expect(getObserverSectionTitle(false, 'M')).toBe('Observando ele');
        expect(getObservedSectionTitle(false, 'F')).toBe('Quem ela observa');
        expect(getObservedSectionTitle(false, 'M')).toBe('Quem ele observa');
    });

    it('mantém apenas o verbo/título neutro quando não há sexo informado', () => {
        expect(getObserverSectionTitle(false, '')).toBe('Observadores');
        expect(getObservedSectionTitle(false, '')).toBe('Observando');
    });
});
