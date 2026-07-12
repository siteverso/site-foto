import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profile = readFileSync(new URL('../src/pages/perfil/[username].astro', import.meta.url), 'utf8');
const publishing = readFileSync(new URL('../public/js/processes/photo-publishing.js', import.meta.url), 'utf8');
const header = readFileSync(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');
const pt = readFileSync(new URL('../src/i18n/pt-BR.ts', import.meta.url), 'utf8');
const en = readFileSync(new URL('../src/i18n/en.ts', import.meta.url), 'utf8');
const es = readFileSync(new URL('../src/i18n/es.ts', import.meta.url), 'utf8');

describe('publicação de imagem no perfil', () => {
  it('mantém o acionador no perfil ligado diretamente ao diálogo', () => {
    expect(profile).toContain('data-open-post-dialog');
    expect(publishing).toContain('document.querySelector("[data-open-post-dialog]")');
    expect(profile).not.toContain("location.hash === '#postar'");
  });

  it('não exibe atalho de postagem na barra superior', () => {
    expect(header).not.toContain('site-post-link');
    expect(header).not.toContain('#postar');
  });

  it('mantém os rótulos de publicação nos três idiomas', () => {
    expect(pt).toContain("newPost: 'Publicar'");
    expect(pt).toContain("publish: 'Enviar publicação'");
    expect(en).toContain("newPost: 'Publish image'");
    expect(es).toContain("newPost: 'Publicar imagen'");
  });
});
