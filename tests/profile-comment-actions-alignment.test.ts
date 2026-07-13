import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const page = fs.readFileSync(path.resolve('src/pages/perfil/[username].astro'), 'utf8');
const css = fs.readFileSync(path.resolve('src/styles/pages/profile-detail.css'), 'utf8');

describe('profile comment action alignment', () => {
  it('keeps the delete button immediately before the date', () => {
    const deleteIndex = page.indexOf('data-comment-delete-trigger');
    const timeIndex = page.indexOf('<time>{formatDate(comment.createdAt)}</time>');
    expect(deleteIndex).toBeGreaterThan(-1);
    expect(timeIndex).toBeGreaterThan(deleteIndex);
  });

  it('places the action row together at the top right on desktop', () => {
    expect(css).toContain('.comment-meta {');
    expect(css).toContain('position: absolute;');
    expect(css).toContain('top: 10px;');
    expect(css).toContain('right: 12px;');
    expect(css).toContain('justify-content: flex-end;');
  });
});
