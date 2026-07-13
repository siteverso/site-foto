import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (file: string) => readFileSync(file, 'utf8');

describe('directional hiding in the feed', () => {
  it('passes the logged user to initial feed and pagination', () => {
    const home = read('src/pages/index.astro');
    expect(home).toContain('getFeedPhotos(user.id');
    expect(home).toContain('getFeedPhotos(user.id, feedLimit, 0)');
  });

  it('supports hide me and hide them independently', () => {
    const source = read('src/lib/server/repositories/photos.ts');
    expect(source).toContain('b.hide_from_target = 1');
    expect(source).toContain('b.hide_target = 1');
    expect(source).toContain('b.blocker_user_id = p.user_id');
    expect(source).toContain('b.blocker_user_id = :viewer_user_id');
  });
});
