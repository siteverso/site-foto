import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const profilePage = readFileSync(new URL('../src/pages/perfil/[username].astro', import.meta.url), 'utf8');

describe('atualização ao vivo das laterais do perfil', () => {
  it('mantém o contêiner de últimas atualizações mesmo quando a lista começa vazia', () => {
    expect(profilePage).toContain('data-live-section="profile-updates" data-live-list');
    expect(profilePage).toContain('<p class="empty-state" data-live-key="empty">{t.home.noUpdates}</p>');
  });

  it('mantém o contêiner de observadores mesmo quando a lista começa vazia', () => {
    expect(profilePage).toContain('data-live-section="profile-observers" data-live-list');
    expect(profilePage).toContain('<p class="empty-state" data-live-key="empty">{t.publicProfile.noObservers}</p>');
  });
});
