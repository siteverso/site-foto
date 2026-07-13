import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/themes/theme-overrides.css', import.meta.url), 'utf8');

describe('profile sidebars across themes', () => {
  it('keeps layout wrappers transparent so only inner cards have backgrounds', () => {
    expect(css).toMatch(/html\s+\.flog-grid\s*>\s*\.flog-panel\s*\{[\s\S]*?background:\s*transparent\s*;[\s\S]*?border-color:\s*transparent\s*;[\s\S]*?box-shadow:\s*none\s*;/);
  });

  it('keeps actual sidebar cards theme-aware', () => {
    expect(css).toMatch(/\.profile-summary-card,[\s\S]*?\.profile-side-section,[\s\S]*?background:\s*var\(--surface\)/);
  });
});
