import { describe, expect, it } from 'vitest';
import { normalizePhotoCaption } from '../src/lib/photo-caption';
import { MESSAGE_MAX_LENGTH } from '../src/lib/message-limit';

describe('legenda da foto', () => {
    it('remove espaços externos e permite legenda vazia', () => {
        expect(normalizePhotoCaption('  Minha foto  ')).toBe('Minha foto');
        expect(normalizePhotoCaption('   ')).toBe('');
    });

    it('rejeita legenda acima do limite', () => {
        expect(() => normalizePhotoCaption('x'.repeat(MESSAGE_MAX_LENGTH + 1))).toThrow();
    });
});
