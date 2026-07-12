import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profilePage = readFileSync('src/pages/perfil/[username].astro', 'utf8');
const publishingCss = readFileSync('src/styles/processes/photo-publishing.css', 'utf8');
const homeCss = readFileSync('src/styles/pages/home-profile.css', 'utf8');

describe('profile publish dialog styles', () => {
  it('imports the publishing process stylesheet on the profile page', () => {
    expect(profilePage).toContain("import '../../styles/processes/photo-publishing.css'");
  });

  it('keeps the complete dialog layout in the publishing process stylesheet', () => {
    expect(publishingCss).toContain('.profile-new-post-button {');
    expect(publishingCss).toContain('.post-dialog[hidden] { display: none; }');
    expect(publishingCss).toContain('position: fixed;');
    expect(publishingCss).toContain('.post-dialog-card {');
    expect(publishingCss).toContain('.dialog-open { overflow: hidden; }');
  });

  it('does not leave profile dialog styles stranded in the home stylesheet', () => {
    expect(homeCss).not.toContain('.post-dialog[hidden]');
    expect(homeCss).not.toContain('.profile-new-post-button {');
  });
});
