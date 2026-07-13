import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('contador de mensagens recebidas no header', () => {
  it('oculta completamente o círculo vermelho quando não há mensagens novas', () => {
    const header = readFileSync('src/components/SiteHeader.astro', 'utf8');
    const css = readFileSync('src/styles/components/site-header.css', 'utf8');

    expect(header).toContain('photoMessagesBadge.hidden = unread <= 0');
    expect(css).toMatch(/\.site-photo-messages-badge\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
  });
});
