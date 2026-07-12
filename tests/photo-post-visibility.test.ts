import { describe, expect, it } from 'vitest';
import { normalizePhotoId, normalizePrivatePhotoMessage } from '../src/lib/private-photo-message';

describe('posts de foto privados', () => {
    it('normaliza conteúdo e identificador da foto', () => {
        expect(normalizePhotoId('42')).toBe(42);
        expect(normalizePrivatePhotoMessage('  reservado ao proprietário  ')).toBe('reservado ao proprietário');
    });

    it('rejeita conteúdo vazio e foto inválida', () => {
        expect(() => normalizePrivatePhotoMessage('   ')).toThrow('MENSAGEM_PRIVADA_INVALIDA');
        expect(() => normalizePhotoId(0)).toThrow('FOTO_INVALIDA');
    });
});
