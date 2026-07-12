import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('rótulos públicos de sexo', () => {
  const app = readFileSync(resolve('public/app.js'), 'utf8');
  const pt = readFileSync(resolve('src/i18n/pt-BR.ts'), 'utf8');

  it('usa Masculino e Feminino na interface pública', () => {
    expect(app).toContain("user.sexCode === 'M' ? 'Masculino'");
    expect(app).toContain("user.sexCode === 'F' ? 'Feminino'");
    expect(app).toContain('<span>Masculino</span>');
    expect(app).toContain('<span>Feminino</span>');
    expect(pt).toContain("sexMale: 'Masculino'");
    expect(pt).toContain("sexFemale: 'Feminino'");
  });

  it('não mantém os rótulos antigos em português', () => {
    expect(app).not.toMatch(/\bMacho(?:s)?\b/);
    expect(app).not.toMatch(/\bFêmea(?:s)?\b/);
  });
});
