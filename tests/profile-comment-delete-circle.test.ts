import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = fs.readFileSync(path.resolve('src/styles/pages/profile-detail.css'), 'utf8');

describe('profile comment circular delete action', () => {
  it('renders the delete action as a visible circular site control', () => {
    expect(css).toContain('.comment-delete-trigger {');
    expect(css).toContain('width: 34px;');
    expect(css).toContain('height: 34px;');
    expect(css).toContain('border-radius: 50%;');
    expect(css).toContain('background: color-mix(in srgb, var(--surface-2) 84%, transparent);');
  });

  it('keeps a clear hover and keyboard focus state', () => {
    expect(css).toContain('.comment-delete-trigger:hover {');
    expect(css).toContain('.comment-delete-trigger:focus-visible {');
  });
});
