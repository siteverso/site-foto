import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const detail = readFileSync('src/pages/foto/[id].astro', 'utf8');
const photosRepository = readFileSync('src/lib/server/repositories/photos.ts', 'utf8');
const home = readFileSync('src/pages/index.astro', 'utf8');
const sentCard = readFileSync('src/components/SentPhotoMessageCard.astro', 'utf8');
const profile = readFileSync('src/pages/perfil/[username].astro', 'utf8');
const composer = readFileSync('src/components/PhotoMessageComposer.astro', 'utf8');
const detailCss = readFileSync('src/styles/pages/photo-detail.css', 'utf8');
const detailShortcuts = readFileSync('public/js/pages/photo-detail-shortcuts.js', 'utf8');

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

  it('uses the full content width without the latest-updates sidebar', () => {
    expect(detail).not.toContain('site-updates-panel');
    expect(detail).not.toContain('getFeedPhotos');
    expect(detail).toContain('class="site-container site-section photo-detail-layout"');
    expect(detailCss).toContain('display: block');
    expect(detailCss).toContain('max-height: none');
    expect(detailCss).toContain('margin: 14px 0 0');
  });

  it('routes home photos to profiles while preserving detail access from profile and sent messages', () => {
    expect(home).toContain('class="photo-post-image-link" href={`/perfil/${photo.username}`}');
    expect(home).toContain('class="photo-post-image-link" href="/perfil/${encodeURIComponent(photo.username)}"');
    expect(sentCard).toContain('href={`/foto/${item.photoId}`}');
    expect(profile).toContain('href={`/foto/${photo.id}`}');
  });

  it('uses Escape as a direct owner-profile shortcut without browser history or modal behavior', () => {
    expect(detail).toContain('data-photo-owner-profile={photo ? `/perfil/${encodeURIComponent(photo.username)}` : undefined}');
    expect(detail).toContain('/js/pages/photo-detail-shortcuts.js');
    expect(detailShortcuts).toContain("event.key !== 'Escape'");
    expect(detailShortcuts).toContain('window.location.assign(profileUrl)');
    expect(detailShortcuts).toContain("{ capture: true }");
    expect(detailShortcuts).not.toContain('history.back');
    expect(detailShortcuts).not.toContain('.close()');
  });

});
