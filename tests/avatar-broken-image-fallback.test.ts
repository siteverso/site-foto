import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const layout = readFileSync(new URL('../src/layouts/AppLayout.astro', import.meta.url), 'utf8');
const fallback = readFileSync(new URL('../public/avatar-fallback.js', import.meta.url), 'utf8');
const sidebar = readFileSync(new URL('../src/components/ProfileSidebar.astro', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/pages/perfil/[username].astro', import.meta.url), 'utf8');

describe('avatar nunca permanece como imagem quebrada', () => {
  it('carrega um tratador global em todas as páginas', () => {
    expect(layout).toContain('/avatar-fallback.js');
    expect(fallback).toContain("image.addEventListener('error'");
    expect(fallback).toContain('fallback.hidden = false');
    expect(fallback).toContain("image.removeAttribute('src')");
  });

  it('mantém iniciais como fallback no card e no modal do perfil', () => {
    expect(sidebar).toContain('data-avatar-container');
    expect(sidebar).toContain('data-avatar-fallback hidden');
    expect(profile).toContain('profile-avatar-dialog-image" data-avatar-container');
    expect(profile).toContain('data-avatar-image');
    expect(profile).toContain('data-avatar-fallback hidden');
  });
});
