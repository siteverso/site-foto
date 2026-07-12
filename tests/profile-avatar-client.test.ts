import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const component = readFileSync(new URL('../src/components/ProfileSidebar.astro', import.meta.url), 'utf8');
const client = readFileSync(new URL('../public/profile-avatar.js', import.meta.url), 'utf8');

describe('editor de avatar do perfil', () => {
  it('carrega o controlador de recorte somente no avatar editável', () => {
    expect(component).toMatch(/editableAvatar && <script[^>]+src="\/profile-avatar\.js/);
  });

  it('clique na foto abre input e escolha abre o recorte', () => {
    expect(client).toMatch(/trigger\.addEventListener\('click', \(\) => input\.click\(\)\)/);
    expect(client).toMatch(/input\.addEventListener\('change'/);
    expect(client).toMatch(/openCropper\(file, message, input\)/);
    expect(client).toMatch(/data-avatar-crop-stage/);
  });

  it('upload usa FormData sem Content-Type manual', () => {
    expect(client).toMatch(/new FormData\(\)/);
    expect(client).toMatch(/fetch\('\/api\/auth\/avatar'/);
    expect(client).not.toMatch(/Content-Type/);
  });
});


it('centraliza a imagem no palco antes de aplicar deslocamento e zoom', () => {
  expect(client).toContain('translate(calc(-50% + ${state.x}px), calc(-50% + ${state.y}px))');
  expect(client).toContain('state.baseScale = Math.max(stageSize() / image.naturalWidth, stageSize() / image.naturalHeight)');
  expect(client).not.toContain('translate3d(${state.x}px, ${state.y}px, 0)');
});
