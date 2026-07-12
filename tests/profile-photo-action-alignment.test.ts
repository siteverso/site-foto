import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const styles = readFileSync(new URL('../src/styles/components/photo-caption.css', import.meta.url), 'utf8');

describe('alinhamento dos botões sobre a foto', () => {
  it('centraliza o ícone dentro do botão circular sem depender da linha de texto', () => {
    expect(styles).toMatch(/\.photo-action-button\s*\{[\s\S]*display:\s*inline-flex;[\s\S]*align-items:\s*center;[\s\S]*justify-content:\s*center;/);
    expect(styles).toMatch(/\.photo-action-button svg\s*\{[\s\S]*display:\s*block;[\s\S]*flex:\s*0 0 18px;[\s\S]*margin:\s*0;/);
  });
});
