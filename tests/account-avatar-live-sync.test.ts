import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const client = readFileSync('public/profile-avatar.js', 'utf8');

describe('sincronização imediata do avatar na conta', () => {
  it('atualiza o avatar lateral e o avatar do topo sem recarregar a página', () => {
    expect(client).toContain("document.querySelectorAll('[data-avatar-image], [data-site-user-avatar-image]')");
    expect(client).toContain('refreshVisibleAvatars(blob, data.user?.avatarUrl || \'\')');
    expect(client).not.toContain('location.reload()');
  });
});
