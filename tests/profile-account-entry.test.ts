import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const header = readFileSync(resolve(root, 'src/components/SiteHeader.astro'), 'utf8');
const profile = readFileSync(resolve(root, 'src/pages/perfil/[username].astro'), 'utf8');

describe('entrada de edição da conta no perfil', () => {
  it('não mantém o atalho Conta no cabeçalho autenticado', () => {
    expect(header).not.toContain('href="/conta"');
  });

  it('mostra Editar conta na coluna esquerda somente para o proprietário', () => {
    expect(profile).toContain('{isOwner && (');
    expect(profile).toContain('class="profile-account-link" href="/conta"');
    expect(profile).toContain('Editar conta');
  });
});
