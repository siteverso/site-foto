import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profilePage = readFileSync('src/pages/perfil/[username].astro', 'utf8');
const layout = readFileSync('src/layouts/AppLayout.astro', 'utf8');
const interactions = readFileSync('public/js/processes/profile-interactions.js', 'utf8');

describe('profile live sync after deleting the final photo', () => {
  it('keeps the observed list mounted even when it becomes empty', () => {
    expect(profilePage).toContain('data-live-section="profile-observed" data-live-list');
    expect(profilePage).toContain('data-live-key="empty">@{profile.username}');
  });

  it('requests an immediate live refresh after a successful deletion', () => {
    expect(interactions).toContain('fotolife:refresh-live-sections');
    expect(layout).toContain("window.addEventListener('fotolife:refresh-live-sections', refreshLiveSections)");
  });
});
