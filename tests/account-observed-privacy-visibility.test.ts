import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/pages/conta.astro'), 'utf8');

describe('visibilidade da seção de pessoas ocultas', () => {
  it('não renderiza a seção visível quando a lista já é privada', () => {
    expect(source).toContain("hidden={account.observerVisibility === 'private'}");
  });

  it('esconde e exibe a seção imediatamente conforme o seletor', () => {
    expect(source).toContain('observedPrivacy.hidden = !isPublic;');
    expect(source).toContain("profileForm?.observerVisibility?.addEventListener('change', syncObservedPrivacyState)");
  });

  it('fecha o seletor aberto ao mudar a lista para privada', () => {
    expect(source).toContain('if (!isPublic && observedLov && !observedLov.hidden) closeObservedLov();');
  });
});
