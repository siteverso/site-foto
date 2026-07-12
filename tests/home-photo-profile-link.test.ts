import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pagePath = fileURLToPath(new URL('../src/pages/index.astro', import.meta.url));
const cssPath = fileURLToPath(new URL('../src/styles/pages/home-photo-card.css', import.meta.url));
const page = readFileSync(pagePath, 'utf8');
const css = readFileSync(cssPath, 'utf8');

describe('Home photo profile navigation', () => {
  it('links both server-rendered and dynamically loaded photos to the owner profile', () => {
    expect(page).toContain('class="photo-post-image-link" href={`/perfil/${photo.username}`}');
    expect(page).toContain('class="photo-post-image-link" href="/perfil/${encodeURIComponent(photo.username)}"');
  });

  it('gives the caption modern spacing without an inner border', () => {
    const captionRule = css.match(/\.photo-post-caption \{([\s\S]*?)\}/)?.[1] || '';
    expect(captionRule).toContain('margin: 6px;');
    expect(captionRule).toContain('padding: 15px 17px;');
    expect(captionRule).toContain('background: var(--surface-2, #f7f7f4);');
    expect(captionRule).toContain('border: 0;');
    expect(captionRule).not.toContain('border: 1px');
  });
});
