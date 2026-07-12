import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profilePage = readFileSync('src/pages/perfil/[username].astro', 'utf8');
const profileCss = readFileSync('src/styles/pages/profile-detail.css', 'utf8');

describe('profile photo date and time', () => {
  it('renders the publication timestamp for every photo in the profile feed', () => {
    expect(profilePage).toContain('class="profile-photo-published-at"');
    expect(profilePage).toContain('<time datetime={photo.publishedAt}>{formatPhotoDateTime(photo.publishedAt)}</time>');
    expect(profilePage).toContain("hour: '2-digit'");
    expect(profilePage).toContain("minute: '2-digit'");
  });

  it('keeps the timestamp subtle and contained in the photo card', () => {
    expect(profileCss).toContain('.profile-photo-published-at {');
    expect(profileCss).toContain('justify-content: flex-end;');
    expect(profileCss).toContain('white-space: nowrap;');
  });
});
