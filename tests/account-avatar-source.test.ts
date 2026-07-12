import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const accountPage = readFileSync(new URL('../src/pages/conta.astro', import.meta.url), 'utf8');

describe('avatar na edição da conta', () => {
  it('reaproveita a mesma origem de avatar usada pela página pública do perfil', () => {
    expect(accountPage).toContain("import { getPublicProfile } from '../lib/server/repositories/photos';");
    expect(accountPage).toContain('const publicProfile = await getPublicProfile(account.username);');
    expect(accountPage).toContain('avatarUrl: publicProfile?.avatarUrl || account.avatarUrl');
    expect(accountPage).toContain('profile={accountSidebar}');
  });
});
