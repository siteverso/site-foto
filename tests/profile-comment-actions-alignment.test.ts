import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/pages/perfil/[username].astro', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/pages/profile-detail.css', import.meta.url), 'utf8');

describe('ações das mensagens da foto', () => {
  it('mantém a lixeira imediatamente à esquerda da data e alinha o grupo à direita', () => {
    expect(page.indexOf('data-comment-delete-area')).toBeLessThan(page.indexOf('<time>{formatDate(comment.createdAt)}</time>'));
    expect(styles).toMatch(/\.comment-meta\s*\{[\s\S]*justify-content:\s*flex-end;/);
  });
});
