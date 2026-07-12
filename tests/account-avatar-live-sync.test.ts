import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../public/profile-avatar.js', import.meta.url), 'utf8');

describe('sincronização imediata do avatar na conta', () => {
  it('atualiza somente os avatares do usuário alterado sem recarregar a página', () => {
    expect(client).toContain("document.querySelectorAll('[data-avatar-image]')");
    expect(client).toContain("element.getAttribute('data-avatar-user-id') !== normalizedUserId");
    expect(client).toContain("refreshVisibleAvatars(blob, data.user?.avatarUrl || '', data.user?.id || '')");
    expect(client).toContain("new CustomEvent('fotolife:avatar-updated'");
    expect(client).not.toContain('location.reload()');
  });
});
