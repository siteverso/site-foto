import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const header = readFileSync(new URL('../src/components/SiteHeader.astro', import.meta.url), 'utf8');
const avatar = readFileSync(new URL('../src/components/UserAvatar.astro', import.meta.url), 'utf8');
const endpoint = readFileSync(new URL('../src/pages/api/users/[id]/avatar.ts', import.meta.url), 'utf8');
const upload = readFileSync(new URL('../src/pages/api/auth/avatar.ts', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/components/site-header.css', import.meta.url), 'utf8');

describe('avatar no topo', () => {
  it('renderiza o componente compartilhado de avatar junto ao nome', () => {
    expect(header).toContain("import UserAvatar from './UserAvatar.astro'");
    expect(header).toContain('class="site-user-avatar"');
    expect(header).toContain('userId={userId}');
    expect(avatar).toContain('getAvatarSources(userId, avatarUrl)');
    expect(avatar).toContain('data-avatar-user-id={userIdValue}');
  });

  it('usa no cabeçalho a mesma imagem BLOB exibida no perfil', () => {
    expect(avatar).toContain('data-avatar-sources={JSON.stringify(sources)}');
    expect(endpoint).toContain('SELECT avatar_image, avatar_mime_type');
    expect(endpoint).toContain("'Cache-Control': 'private, no-store, max-age=0, must-revalidate'");
  });

  it('renova o usuário em cache logo após trocar a imagem', () => {
    expect(upload).toContain('invalidateCurrentUser(context)');
    expect(upload).toContain('await currentUser(context)');
  });

  it('mantém formato circular e recorte de capa', () => {
    expect(css).toContain('border-radius: 50%');
    expect(css).toContain('object-fit: cover');
  });
});
