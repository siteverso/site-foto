import { describe, expect, it } from 'vitest';
import { normalizePhotoId, normalizePrivatePhotoMessage } from '../src/lib/private-photo-message';

describe('normalizePrivatePhotoMessage', () => {
    it('remove espaços externos e mantém a mensagem', () => {
        expect(normalizePrivatePhotoMessage('  mensagem reservada  ')).toBe('mensagem reservada');
    });

    it('rejeita mensagem vazia ou acima do limite', () => {
        expect(() => normalizePrivatePhotoMessage('   ')).toThrow('MENSAGEM_PRIVADA_INVALIDA');
        expect(() => normalizePrivatePhotoMessage('x'.repeat(257))).toThrow('MENSAGEM_PRIVADA_INVALIDA');
    });
});

describe('normalizePhotoId', () => {
    it('aceita somente identificador inteiro positivo', () => {
        expect(normalizePhotoId('12')).toBe(12);
        expect(() => normalizePhotoId(0)).toThrow('FOTO_INVALIDA');
        expect(() => normalizePhotoId('x')).toThrow('FOTO_INVALIDA');
    });
});
