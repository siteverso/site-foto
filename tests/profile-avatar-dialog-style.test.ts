import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const component = fs.readFileSync('src/components/ProfileSidebar.astro', 'utf8');
const css = fs.readFileSync('src/styles/processes/avatar-editing.css', 'utf8');
const script = fs.readFileSync('public/profile-avatar.js', 'utf8');

describe('editor autônomo de foto de perfil', () => {
  it('carrega seu próprio CSS no componente', () => {
    expect(component).toContain("import '../styles/processes/avatar-editing.css'");
  });

  it('não depende das classes genéricas de modal do feed', () => {
    expect(script).toContain("backdrop.className = 'avatar-crop-backdrop'");
    expect(script).toContain('class="avatar-crop-card"');
    expect(script).not.toContain("backdrop.className = 'modal-backdrop'");
    expect(css).toContain('.avatar-crop-backdrop');
    expect(css).toContain('position: fixed');
    expect(css).toContain('.avatar-crop-card');
  });

  it('bloqueia a rolagem e limpa listeners ao fechar', () => {
    expect(css).toContain('html.dialog-open');
    expect(script).toContain("window.removeEventListener('resize', onResize)");
    expect(script).toContain("document.removeEventListener('keydown', onEscape)");
    expect(script).toContain('URL.revokeObjectURL(objectUrl)');
  });
});
