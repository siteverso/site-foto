import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/pages/foto/[id].astro', 'utf8');
const component = readFileSync('src/components/PhotoLightbox.astro', 'utf8');
const script = readFileSync('public/js/pages/photo-lightbox.js', 'utf8');
const css = readFileSync('src/styles/pages/photo-detail.css', 'utf8');
const repository = readFileSync('src/lib/server/repositories/photos.ts', 'utf8');

describe('visualizador avançado de foto', () => {
  it('abre pela própria imagem e mantém comentários fora do popup', () => {
    expect(page).toContain('data-open-photo-lightbox');
    expect(page).toContain('<PhotoLightbox');
    expect(component).not.toContain('comment');
  });

  it('oferece fechar, tela cheia e navegação por perfil ou global', () => {
    expect(component).toContain('data-photo-fullscreen');
    expect(component).toContain('data-photo-lightbox-close');
    expect(component).toContain('data-navigation-mode="profile"');
    expect(component).toContain('data-navigation-mode="global"');
    expect(script).toContain('requestFullscreen');
    expect(script).toContain('applyNavigationMode');
  });

  it('calcula as duas navegações com bordas para suportar loop sem duplicar a consulta base', () => {
    expect(repository).toContain('getAdjacentPhotoIdsByScope');
    expect(repository).toContain('getPhotoNavigation');
    expect(repository).toContain('p.user_id = :user_id');
    expect(repository).toContain('LAG(p.id)');
    expect(repository).toContain('LEAD(p.id)');
    expect(repository).toContain('FIRST_VALUE(p.id)');
    expect(repository).toContain('LAST_VALUE(p.id)');
  });

  it('inclui slideshow configurável, loop padrão, caption e marca d’água sem efeitos', () => {
    expect(component).toContain('data-slideshow-toggle');
    expect(component).toContain('data-slideshow-interval');
    expect(component).not.toContain('data-slideshow-effect');
    expect(component).toContain('data-slideshow-loop');
    expect(component).toContain('photo-lightbox-watermark');
    expect(component).toContain('@{username}');
    expect(script).toContain('fotolife-photo-viewer');
    expect(script).toContain('getNextSlideshowHref');
    expect(script).toContain('navigatePhoto');
    expect(script).not.toContain('getEffectDuration');
    expect(script).not.toContain('applyEffect');
    expect(script).toContain('isLoopEnabled');
    expect(script).toContain('loadPhotoView');
    expect(script).toContain('copyViewerState');
    expect(script).toContain('history.pushState');
    expect(script).not.toContain('window.location.href = href');
    expect(css).not.toContain('.photo-lightbox-image.effect-');
    expect(css).toContain('height: 100dvh');
    expect(css).toContain('object-fit: contain');
    expect(css).toMatch(/\.photo-lightbox-image\s*\{[^}]*width:\s*100%[^}]*height:\s*100%/s);
    expect(css).toMatch(/\.photo-lightbox-stage\s*\{[^}]*overflow:\s*hidden/s);
    expect(css).toMatch(/\.photo-lightbox-shell\s*\{[^}]*box-sizing:\s*border-box/s);
  });
});
