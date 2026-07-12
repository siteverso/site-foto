import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const sidebar = readFileSync(new URL('../src/components/ProfileSidebar.astro', import.meta.url), 'utf8');
const client = readFileSync(new URL('../public/profile-avatar.js', import.meta.url), 'utf8');
const endpoint = readFileSync(new URL('../src/pages/api/auth/avatar.ts', import.meta.url), 'utf8');

 describe('remoção confirmada da foto de perfil', () => {
  it('só renderiza a ação de remoção quando existe uma foto', () => {
    expect(sidebar).toContain('const hasCustomAvatar = Boolean(profile?.hasCustomAvatar ?? avatarUrl);');
    expect(sidebar).toContain('hidden={!hasCustomAvatar}');
    expect(sidebar).toContain('data-avatar-remove');
    expect(sidebar).toContain('account-avatar-remove');
  });

  it('exige confirmação e atualiza a interface sem recarregar', () => {
    expect(client).toContain('Remover foto de perfil?');
    expect(client).toContain("method: 'DELETE'");
    expect(client).toContain('showAvatarFallback(data.user?.id || userId)');
    expect(client).toContain("new CustomEvent('fotolife:avatar-updated'");
    expect(client).not.toContain('location.reload()');
  });

  it('remove imagem binária e URL externa no servidor', () => {
    expect(endpoint).toContain('export const DELETE');
    expect(endpoint).toContain('avatar_image = NULL');
    expect(endpoint).toContain('avatar_mime_type = NULL');
    expect(endpoint).toContain('avatar_url = NULL');
  });
});
