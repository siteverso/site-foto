import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const page = fs.readFileSync(path.resolve('src/pages/perfil/mensagens-recebidas.astro'), 'utf8');
const wrapper = fs.readFileSync(path.resolve('src/components/ReceivedPhotoMessageCard.astro'), 'utf8');
const component = fs.readFileSync(path.resolve('src/components/PhotoMessageCard.astro'), 'utf8');
const script = fs.readFileSync(path.resolve('src/scripts/received-photo-message-card.ts'), 'utf8');
const css = fs.readFileSync(path.resolve('src/styles/components/received-photo-message-card.css'), 'utf8');

describe('received photo message component', () => {
  it('uses the shared independent card on the received messages page', () => {
    expect(page).toContain("import ReceivedPhotoMessageCard from '../../components/ReceivedPhotoMessageCard.astro'");
    expect(wrapper).toContain("import PhotoMessageCard from './PhotoMessageCard.astro'");
    expect(component).toContain("import '../styles/components/received-photo-message-card.css'");
    expect(component).toContain("import '../scripts/received-photo-message-card'");
  });

  it('keeps delete control immediately before the date', () => {
    expect(component).toContain('class="received-message-actions"');
    expect(component.indexOf('data-received-message-delete')).toBeLessThan(component.indexOf('<time datetime={createdAt}>'));
    expect(css).toMatch(/margin-left:\s*auto/);
    expect(css).toMatch(/justify-content:\s*flex-end/);
    expect(component).not.toContain('comment-meta');
    expect(component).not.toContain('comment-content');
  });

  it('uses the existing comment delete endpoint with inline confirmation', () => {
    expect(script).toContain("fetch(`/api/comments/${id}`, { method: 'DELETE' })");
    expect(script).toContain('data-received-message-confirm');
    expect(script).toContain('data-received-message-cancel');
  });
});
