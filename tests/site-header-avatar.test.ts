import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const header = fs.readFileSync('src/components/SiteHeader.astro', 'utf8');
const css = fs.readFileSync('src/styles/components/site-header.css', 'utf8');

describe('avatar no topo', () => {
  it('renderiza a imagem do usuário junto ao nome no cabeçalho', () => {
    expect(header).toContain('avatarUrl?: string');
    expect(header).toContain('class=\"site-user-avatar\"');
    expect(header).toContain('<img src={avatarUrl}');
  });

  it('mantém formato circular e recorte de capa', () => {
    expect(css).toMatch(/\.site-user-avatar\s*\{[\s\S]*border-radius:\s*50%/);
    expect(css).toMatch(/\.site-user-avatar img\s*\{[\s\S]*object-fit:\s*cover/);
  });
});
