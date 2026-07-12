import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const composer = readFileSync('src/components/PhotoMessageComposer.astro', 'utf8');
const detail = readFileSync('src/pages/foto/[id].astro', 'utf8');
const profile = readFileSync('src/pages/perfil/[username].astro', 'utf8');
const repository = readFileSync('src/lib/server/repositories/photos.ts', 'utf8');

describe('shared photo message composer', () => {
  it('is reused by profile and detail with the private selector', () => {
    expect(detail).toContain("import PhotoMessageComposer");
    expect(profile).toContain("import PhotoMessageComposer");
    expect(composer).toContain('name="private"');
    expect(composer).toContain('name="message"');
  });

  it('does not reject a private message merely because sender owns the photo', () => {
    expect(repository).not.toContain("if (isPrivate && ownerUserId == userId)");
  });
});
