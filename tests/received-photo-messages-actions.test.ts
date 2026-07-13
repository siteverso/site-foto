import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const page = fs.readFileSync(path.resolve('src/pages/perfil/mensagens-recebidas.astro'), 'utf8');
const css = fs.readFileSync(path.resolve('src/styles/pages/received-photo-messages.css'), 'utf8');

describe('received photo message actions', () => {
  it('keeps delete control immediately before the date in a right-aligned action group', () => {
    expect(page).toContain('class="received-message-actions"');
    expect(page.indexOf('data-received-message-delete')).toBeLessThan(page.indexOf('<time datetime={item.createdAt}>'));
    expect(css).toContain('margin-left:auto');
    expect(css).toContain('justify-content:flex-end');
  });

  it('uses the existing comment delete endpoint with inline confirmation', () => {
    expect(page).toContain("fetch(`/api/comments/${id}`, { method: 'DELETE' })");
    expect(page).toContain('data-received-message-confirm');
    expect(page).toContain('data-received-message-cancel');
  });
});
