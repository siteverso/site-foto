import { describe, expect, it } from 'vitest';
import { getAvatarSources } from '../src/lib/avatar';

describe('fontes de avatar', () => {
  it('prioriza o BLOB do banco pelo ID', () => {
    expect(getAvatarSources(42, 'https://example.com/avatar.jpg')).toEqual([
      '/api/users/42/avatar',
      'https://example.com/avatar.jpg',
    ]);
  });

  it('aceita ID vindo como string do driver/banco', () => {
    expect(getAvatarSources('7', '')).toEqual(['/api/users/7/avatar']);
  });

  it('mantém URL externa quando não há ID válido', () => {
    expect(getAvatarSources(undefined, ' https://example.com/a.png ')).toEqual([
      'https://example.com/a.png',
    ]);
  });

  it('não repete a rota BLOB versionada recebida da sessão', () => {
    expect(getAvatarSources(9, '/api/users/9/avatar?v=20260712')).toEqual([
      '/api/users/9/avatar',
    ]);
  });
});
