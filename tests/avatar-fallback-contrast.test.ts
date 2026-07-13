import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const foundation = readFileSync(new URL('../src/styles/core/foundation.css', import.meta.url), 'utf8');
const header = readFileSync(new URL('../src/styles/components/site-header.css', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/styles/pages/home-profile.css', import.meta.url), 'utf8');

describe('contraste das iniciais do avatar', () => {
  it('aplica fallback visível com fundo e texto contrastantes em qualquer avatar', () => {
    expect(foundation).toContain('[data-user-avatar] [data-avatar-fallback]');
    expect(foundation).toContain('color: var(--inverse);');
    expect(foundation).toContain('background: color-mix(in srgb, var(--strong) 88%, var(--surface));');
    expect(foundation).toContain('[data-avatar-fallback][hidden]');
  });

  it('reforça o contraste nos avatares do topo e de últimas atualizações', () => {
    expect(header).toContain('.site-user-avatar [data-avatar-fallback]');
    expect(home).toContain('.site-update-avatar [data-avatar-fallback]');
  });
});
