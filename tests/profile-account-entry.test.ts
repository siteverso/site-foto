import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const header = readFileSync(resolve(root, 'src/components/SiteHeader.astro'), 'utf8');
const sidebar = readFileSync(resolve(root, 'src/components/ProfileSidebar.astro'), 'utf8');
const profile = readFileSync(resolve(root, 'src/pages/perfil/[username].astro'), 'utf8');
const account = readFileSync(resolve(root, 'src/pages/conta.astro'), 'utf8');

describe('navegação padronizada entre perfil e conta', () => {
  it('não mantém o atalho Conta no cabeçalho autenticado', () => {
    expect(header).not.toContain('href="/conta"');
  });

  it('centraliza os dois atalhos no componente lateral reutilizável', () => {
    expect(sidebar).toContain('href="/conta"');
    expect(sidebar).toContain('Editar conta');
    expect(sidebar).toContain('href="/perfil"');
    expect(sidebar).toContain('Ver meu perfil');
    expect(profile).toContain('<ProfileSidebar');
    expect(account).toContain('<ProfileSidebar');
  });
});
