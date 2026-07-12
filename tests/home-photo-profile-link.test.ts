import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pagePath = fileURLToPath(new URL('../src/pages/index.astro', import.meta.url));
const cssPath = fileURLToPath(new URL('../src/styles/global.css', import.meta.url));
const page = readFileSync(pagePath, 'utf8');
const css = readFileSync(cssPath, 'utf8');

describe('Home photo profile navigation', () => {
  it('links both server-rendered and dynamically loaded photos to the owner profile', () => {
    expect(page).toContain('class="photo-post-image-link" href={`/perfil/${photo.username}`}');
    expect(page).toContain('class="photo-post-image-link" href="/perfil/${encodeURIComponent(photo.username)}"');
  });

  it('gives the caption modern spacing and a contained surface', () => {
    expect(css).toContain('.photo-post-caption {');
    expect(css).toContain('margin: 18px;');
    expect(css).toContain('padding: 15px 17px;');
    expect(css).toContain('background: var(--surface-2, #f7f7f4);');
  });
});
