import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const page = fs.readFileSync(path.resolve('src/pages/perfil/[username].astro'), 'utf8');
const component = fs.readFileSync(path.resolve('src/components/PhotoMessageCard.astro'), 'utf8');
const css = fs.readFileSync(path.resolve('src/styles/components/received-photo-message-card.css'), 'utf8');

describe('profile comment shared component', () => {
  it('applies the same card component inside the profile photo feed', () => {
    expect(page).toContain("import PhotoMessageCard from '../../components/PhotoMessageCard.astro'");
    expect(page).toContain('<PhotoMessageCard');
    expect(page).toContain('mode="inline"');
  });

  it('keeps delete immediately before date in the shared component', () => {
    expect(component.indexOf('data-comment-delete-trigger')).toBeLessThan(component.indexOf('<time datetime={createdAt}>'));
    expect(css).toContain('.received-message-card.is-inline');
  });
});
