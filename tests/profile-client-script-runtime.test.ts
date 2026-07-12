import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const profilePage = readFileSync(new URL('../src/pages/perfil/[username].astro', import.meta.url), 'utf8');
const sidebar = readFileSync(new URL('../src/components/ProfileSidebar.astro', import.meta.url), 'utf8');
const profileEntry = readFileSync(new URL('../public/js/pages/profile.js', import.meta.url), 'utf8');

const clientFiles = [
  '../public/js/core/dom.js',
  '../public/js/pages/profile.js',
  '../public/js/processes/profile-interactions.js',
  '../public/js/processes/photo-publishing.js',
  '../public/js/processes/photo-comments.js',
  '../public/profile-avatar.js',
];

describe('profile client scripts', () => {
  it('loads profile behavior from isolated process modules', () => {
    expect(profilePage).toContain('id="profile-client-messages"');
    expect(profilePage).toContain('src="/js/pages/profile.js?v=20260712-1"');
    expect(profilePage).not.toContain('<script define:vars=');
    expect(profileEntry).toContain("import '../processes/profile-interactions.js'");
    expect(profileEntry).toContain("import '../processes/photo-publishing.js'");
    expect(profileEntry).toContain("import '../processes/photo-comments.js'");
  });

  it('contains no raw Astro expression inside client-side HTML templates', () => {
    for (const relative of clientFiles) {
      const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
      expect(source).not.toMatch(/\{t\.[\w.]+\}/);
    }
  });

  it('all profile client modules pass the Node JavaScript parser', () => {
    for (const relative of clientFiles) {
      const pathname = new URL(relative, import.meta.url).pathname;
      expect(() => execFileSync(process.execPath, ['--check', pathname])).not.toThrow();
    }
  });

  it('loads the avatar editor as a normal public module', () => {
    expect(sidebar).toContain('<script type="module" src="/profile-avatar.js?v=20260712-5"></script>');
    expect(sidebar).not.toContain('type="module" is:inline src="/profile-avatar.js');
  });
});
