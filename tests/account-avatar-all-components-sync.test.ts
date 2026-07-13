import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../public/profile-avatar.js', import.meta.url), 'utf8');

// Regressão: se a página nasceu sem foto, o card lateral só tem iniciais.
// Ao enviar uma foto, o cliente precisa criar a tag <img>, não apenas atualizar imagens já existentes.
describe('sincronização integral do avatar sem recarregar', () => {
  it('localiza todos os contêineres do mesmo usuário', () => {
    expect(client).toContain("document.querySelectorAll('[data-avatar-container], [data-user-avatar]')");
    expect(client).toContain("element.getAttribute('data-avatar-user-id') === normalizedUserId");
  });

  it('cria uma imagem quando o componente possuía somente fallback de iniciais', () => {
    expect(client).toContain("document.createElement('img')");
    expect(client).toContain("container.insertBefore(image, fallback || container.firstChild)");
    expect(client).toContain('ensureAvatarImage(container, normalizedUserId)');
  });

  it('oculta as iniciais e atualiza todas as imagens do usuário imediatamente', () => {
    expect(client).toContain("fallback.hidden = true");
    expect(client).toContain("image.src = previewUrl");
    expect(client).toContain("image.dataset.avatarSources = JSON.stringify(sources)");
  });
});
