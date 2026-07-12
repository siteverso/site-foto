import { describe, expect, it, vi } from 'vitest';

const execute = vi.fn();
const commit = vi.fn();
const rollback = vi.fn();

vi.mock('../src/lib/server/oracle', () => ({
  withConnection: async (callback: (connection: unknown) => unknown) => callback({ execute, commit, rollback }),
}));

import { getAccountProfile, updateAccountProfile } from '../src/lib/server/repositories/account-profile';

describe('lista de perfis observados na conta', () => {
  it('consulta somente relações ativas em que o usuário autenticado é o observador', async () => {
    execute
      .mockResolvedValueOnce({ rows: [{
        USERNAME: 'dono', EMAIL: 'dono@example.com', BIO: '', SEX_CODE: 'M', AVATAR_URL: '',
        HAS_PASSWORD: 1, HAS_GOOGLE: 0, PHOTO_COUNT: 0, MESSAGE_COUNT: 0,
        OBSERVER_COUNT: 0, OBSERVER_VISIBILITY_CODE: 'public',
      }] })
      .mockResolvedValueOnce({ rows: [
        { ID: 2, USERNAME: 'um', AVATAR_URL: '', IS_HIDDEN: 0 },
        { ID: 3, USERNAME: 'dois', AVATAR_URL: '', IS_HIDDEN: 1 },
        { ID: 4, USERNAME: 'tres', AVATAR_URL: '', IS_HIDDEN: 0 },
      ] });

    const account = await getAccountProfile(1);
    const observedSql = String(execute.mock.calls[1][0]);
    const binds = execute.mock.calls[1][1];

    expect(observedSql).toContain('friendship.user_id = :id');
    expect(observedSql).toContain('friendship.friend_user_id = observed.id');
    expect(observedSql).toContain("friendship.status = 'A'");
    expect(observedSql).toContain('observed.id <> :id');
    expect(binds).toEqual({ id: 1 });
    expect(account.observedCount).toBe(3);
    expect(account.observedUsers.map(item => item.username)).toEqual(['um', 'dois', 'tres']);
    expect(account.observedUsers[1].hidden).toBe(true);
  });

  it('só grava ocultação quando o alvo continua sendo observado', async () => {
    execute.mockReset();
    execute.mockResolvedValue({ rowsAffected: 1 });

    await updateAccountProfile(1, {
      username: 'dono', email: 'dono@example.com', bio: '', sexCode: 'M',
      observerVisibility: 'public', hiddenObservedUserIds: [2],
    });

    const insertCall = execute.mock.calls.find(call => String(call[0]).includes('INSERT INTO murm_observer_hidden'));
    expect(insertCall).toBeTruthy();
    expect(String(insertCall?.[0])).toContain('f.user_id = :owner_user_id');
    expect(String(insertCall?.[0])).toContain('f.friend_user_id = :hidden_user_id');
    expect(String(insertCall?.[0])).toContain("f.status = 'A'");
    expect(String(insertCall?.[0])).toContain('f.friend_user_id <> f.user_id');
  });
});
