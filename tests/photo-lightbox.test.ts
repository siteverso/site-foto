import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/pages/foto/[id].astro', 'utf8');
const component = readFileSync('src/components/PhotoLightbox.astro', 'utf8');
const script = readFileSync('public/js/pages/photo-lightbox.js', 'utf8');
const css = readFileSync('src/styles/pages/photo-detail.css', 'utf8');
const repository = readFileSync('src/lib/server/repositories/photos.ts', 'utf8');

describe('visualizador de foto', () => {
  it('abre pela própria imagem e mantém comentários fora do popup', () => {
    expect(page).toContain('data-open-photo-lightbox');
    expect(page).toContain('<PhotoLightbox');
    expect(component).not.toContain('comment');
  });

  it('oferece fechar, tela cheia e navegação adjacente', () => {
    expect(component).toContain('data-photo-fullscreen');
    expect(component).toContain('data-photo-lightbox-close');
    expect(component).toContain('data-photo-previous');
    expect(component).toContain('data-photo-next');
    expect(script).toContain('requestFullscreen');
    expect(script).toContain('ArrowLeft');
    expect(script).toContain('ArrowRight');
  });

  it('busca fotos anterior e próxima no banco e usa overlay de viewport inteira', () => {
    expect(repository).toContain('LAG(p.id)');
    expect(repository).toContain('LEAD(p.id)');
    expect(css).toContain('height: 100dvh');
    expect(css).toContain('object-fit: contain');
  });
});
