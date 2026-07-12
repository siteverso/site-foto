import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const sidebar = readFileSync('src/components/ProfileSidebar.astro', 'utf8');
const profilePage = readFileSync('src/pages/perfil/[username].astro', 'utf8');
const avatarCss = readFileSync('src/styles/components/profile-avatar.css', 'utf8');

describe('profile avatar dialog for owner', () => {
  it('opens the same dialog even when the owner has only initials', () => {
    expect(sidebar).toContain('data-open-avatar-dialog');
    expect(sidebar).not.toContain('!avatarUrl && isOwner');
  });

  it('shows an owner-only account link inside the image dialog', () => {
    expect(profilePage).toContain('{isOwner && (');
    expect(profilePage).toContain('class="profile-avatar-dialog-owner-link"');
    expect(profilePage).toContain('href="/conta"');
    expect(profilePage).toContain('t.profile.ownerPhotoHint');
  });

  it('styles the owner hint as a subtle corner overlay', () => {
    expect(avatarCss).toContain('.profile-avatar-dialog-owner-link');
    expect(avatarCss).toContain('position: absolute');
    expect(avatarCss).toContain('bottom: 12px');
  });
});
