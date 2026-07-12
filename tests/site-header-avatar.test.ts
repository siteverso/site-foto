import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const header = fs.readFileSync('src/components/SiteHeader.astro', 'utf8');
const css = fs.readFileSync('src/styles/components/site-header.css', 'utf8');
const session = fs.readFileSync('src/lib/server/session.ts', 'utf8');
const avatarApi = fs.readFileSync('src/pages/api/auth/avatar.ts', 'utf8');

describe('avatar no topo', () => {
  it('renderiza a imagem do usuário junto ao nome no cabeçalho', () => {
    expect(header).toContain('userId?: number');
    expect(header).toContain('avatarUrl?: string');
    expect(header).toContain('class=\"site-user-avatar\"');
    expect(header).toContain('const resolvedAvatarUrl = avatarUrl ||');
    expect(header).toContain('<img src={resolvedAvatarUrl}');
    expect(header).toContain('data-site-user-avatar-image');
  });

  it('usa no cabeçalho a mesma imagem BLOB exibida no perfil', () => {
    expect(session).toContain("WHEN u.avatar_image IS NOT NULL THEN");
    expect(session).toContain("'/api/users/' || u.id || '/avatar?v='");
  });

  it('renova o usuário em cache logo após trocar a imagem', () => {
    expect(avatarApi).toContain('invalidateCurrentUser(context)');
    expect(avatarApi.indexOf('invalidateCurrentUser(context)')).toBeLessThan(avatarApi.indexOf('await currentUser(context)'));
  });

  it('mantém formato circular e recorte de capa', () => {
    expect(css).toMatch(/\.site-user-avatar\s*\{[\s\S]*border-radius:\s*50%/);
    expect(css).toMatch(/\.site-user-avatar img\s*\{[\s\S]*object-fit:\s*cover/);
  });
});
