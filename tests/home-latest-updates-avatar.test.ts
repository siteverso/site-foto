import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/pages/home-profile.css', import.meta.url), 'utf8');

describe('avatar nas últimas atualizações', () => {
  it('reaproveita o componente de avatar com id e URL do autor', () => {
    expect(home).toContain("import UserAvatar from '../components/UserAvatar.astro'");
    expect(home).toContain('class="site-update-avatar"');
    expect(home).toContain('userId={photo.userId}');
    expect(home).toContain('avatarUrl={photo.avatarUrl}');
    expect(home).not.toContain('<img src={`/api/photos/${photo.id}`} alt="" loading="lazy" />');
  });

  it('mantém o avatar circular e com recorte', () => {
    expect(css).toContain('.site-update-avatar{');
    expect(css).toContain('border-radius:50%');
    expect(css).toContain('.site-update-avatar img{width:100%;height:100%;object-fit:cover}');
  });
});
