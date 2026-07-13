import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('bloqueio total no feed', () => {
  it('passa o usuário logado para o feed inicial e para a paginação', () => {
    expect(read('src/pages/index.astro')).toContain('getFeedPhotos(user.id, feedLimit, 0)');
    expect(read('src/pages/api/feed/index.ts')).toContain('getFeedPhotos(user.id, 20, offset)');
  });

  it('remove do feed os dois lados de um bloqueio total', () => {
    const source = read('src/lib/server/repositories/photos.ts');
    expect(source).toContain('export async function getFeedPhotos(viewerUserId: number');
    expect(source).toContain("NVL(LOWER(TRIM(b.block_level)), 'all') = 'all'");
    expect(source).toContain('(b.blocker_user_id = :viewer_user_id AND b.blocked_user_id = p.user_id)');
    expect(source).toContain('(b.blocker_user_id = p.user_id AND b.blocked_user_id = :viewer_user_id)');
  });
});
