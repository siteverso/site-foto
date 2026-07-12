import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const repository = readFileSync(new URL('../src/lib/server/repositories/photos.ts', import.meta.url), 'utf8');

function functionSource(name: string): string {
    const start = repository.indexOf(`export async function ${name}`);
    const next = repository.indexOf('\nexport async function ', start + 1);
    return repository.slice(start, next === -1 ? repository.length : next);
}

describe('última atualização por usuário', () => {
    it('deduplica o feed pela pessoa antes de aplicar paginação', () => {
        const source = functionSource('getFeedPhotos');
        expect(source).toContain('PARTITION BY p.user_id');
        expect(source).toContain('WHERE user_photo_order = 1');
        expect(source.indexOf('WHERE user_photo_order = 1')).toBeLessThan(source.indexOf('WHERE row_number_value > :photo_offset'));
        expect(source).toContain('ORDER BY p.created_at DESC, p.id DESC');
    });

    it('deduplica também o bloco de últimas atualizações do perfil', () => {
        const source = functionSource('getLatestPhotos');
        expect(source).toContain('PARTITION BY p.user_id');
        expect(source).toContain('WHERE user_photo_order = 1');
        expect(source).toContain('WHERE update_order <= 8');
    });
});
