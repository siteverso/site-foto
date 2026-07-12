import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const header = readFileSync(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/pages/perfil/[username].astro', import.meta.url), 'utf8');
const publishing = readFileSync(new URL('../public/js/processes/photo-publishing.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/pages/profile-detail.css', import.meta.url), 'utf8');

describe('publicação de imagem no perfil', () => {
  it('não mantém atalho de postagem na barra superior', () => {
    expect(header).not.toContain('#postar');
    expect(header).not.toContain('site-post-link');
  });

  it('abre o diálogo diretamente pelo botão do perfil', () => {
    expect(profile).toContain('data-open-post-dialog');
    expect(publishing).toContain('document.querySelector("[data-open-post-dialog]")');
    expect(profile).not.toContain("location.hash === '#postar'");
  });

  it('mantém o CTA em largura total e com tratamento glass', () => {
    expect(styles).toContain('.profile-new-post-button');
    expect(styles).toContain('width: 100%');
    expect(styles).toContain('backdrop-filter: blur(');
  });
});
