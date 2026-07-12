import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const detail = readFileSync('src/pages/foto/[id].astro', 'utf8');
const photosRepository = readFileSync('src/lib/server/repositories/photos.ts', 'utf8');
const home = readFileSync('src/pages/index.astro', 'utf8');
const sentCard = readFileSync('src/components/SentPhotoMessageCard.astro', 'utf8');
const profile = readFileSync('src/pages/perfil/[username].astro', 'utf8');
const composer = readFileSync('src/components/PhotoMessageComposer.astro', 'utf8');
const detailCss = readFileSync('src/styles/pages/photo-detail.css', 'utf8');

describe('public photo detail page', () => {
  it('loads one published photo through a cohesive repository function', () => {
    expect(photosRepository).toContain('export async function getPhotoById');
    expect(detail).toContain('getPhotoById(photoId)');
    expect(detail).toContain('Astro.response.status = 404');
  });

  it('reuses comments permissions, home card classes and the shared composer', () => {
    expect(detail).toContain('getComments(photo.id, user.id, 50)');
    expect(detail).toContain('comment.isPrivate && !comment.canRead');
    expect(detail).toContain('class="photo-post profile-photo-post photo-detail-thread"');
    expect(detail).toContain('class="comments-panel photo-comments" data-comments-panel');
    expect(detail).toContain('<PhotoMessageComposer');
    expect(profile).toContain('<PhotoMessageComposer');
    expect(composer).toContain('name="private"');
    expect(composer).toContain('private-toggle-public');
    expect(detailCss).toContain('border-radius: 20px');
    expect(detailCss).toContain('padding: 18px');
  });

  it('routes feed photos and sent-message thumbnails to the detail page', () => {
    expect(home).toContain('href={`/foto/${photo.id}`}');
    expect(home).toContain('href="/foto/${photo.id}"');
    expect(sentCard).toContain('href={`/foto/${item.photoId}`}');
    expect(profile).toContain('href={`/foto/${photo.id}`}');
  });
});
