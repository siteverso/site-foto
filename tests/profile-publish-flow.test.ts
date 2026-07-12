import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const profile = readFileSync(new URL('../src/pages/perfil/[username].astro', import.meta.url), 'utf8');

describe('fluxo do botão Publicar', () => {
  it('habilita após a imagem da prévia estar pronta, sem depender do término do staging', () => {
    expect(profile).toContain('publishButton.disabled = isPublishing || !previewReady');
    expect(profile).not.toContain('isPublishing || !(uploadToken && previewReady)');
  });

  it('aguarda o staging no submit antes de publicar', () => {
    expect(profile).toContain('const pendingUpload = uploadPromise');
    expect(profile).toContain('const token = uploadToken || await pendingUpload');
  });

  it('transforma resposta inválida do staging em erro visível em vez de travar a Promise', () => {
    expect(profile).toContain('try {\n            const responseData = JSON.parse(xhr.responseText)');
    expect(profile).toContain('reject(error instanceof Error ? error : new Error(clientMessages.uploadError))');
  });
});
