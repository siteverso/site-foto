import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profileCss = readFileSync('src/styles/pages/profile-detail.css', 'utf8');
const homeCss = readFileSync('src/styles/pages/home-profile.css', 'utf8');

describe('profile layout CSS ownership', () => {
  it('keeps profile side-panel layout in the profile page stylesheet', () => {
    expect(profileCss).toContain('.profile-side-section');
    expect(profileCss).toContain('.flog-grid > .flog-panel');
    expect(homeCss).not.toContain('Perfil: observadores à esquerda');
  });

  it('prevents the comment submit button from wrapping', () => {
    expect(profileCss).toContain('flex-wrap: nowrap');
    expect(profileCss).toContain('flex: 0 0 44px');
    expect(profileCss).toContain('min-width: 44px');
  });
});
