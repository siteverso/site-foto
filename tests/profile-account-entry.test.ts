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
    expect(sidebar).toContain('t.profile.editAccount');
    expect(sidebar).toContain('href="/perfil"');
    expect(sidebar).toContain('t.profile.viewMyProfile');
    expect(profile).toContain('<ProfileSidebar');
    expect(account).toContain('<ProfileSidebar');
  });
  it('abre o visualizador do avatar mesmo quando o proprietário ainda não tem foto', () => {
    expect(sidebar).not.toContain('!avatarUrl && isOwner');
    expect(sidebar).toContain('class="profile-avatar-button"');
    expect(sidebar).toContain('data-open-avatar-dialog');
  });

});
