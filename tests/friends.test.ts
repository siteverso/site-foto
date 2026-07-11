import { describe, expect, it, vi } from 'vitest';
import { removeFriendWithConnection } from '../src/lib/server/repositories/photos';

describe('removeFriendWithConnection', () => {
    it('remove as duas direções da relação de amizade', async () => {
        const execute = vi.fn().mockResolvedValue({ rowsAffected: 2 });

        const removed = await removeFriendWithConnection({ execute }, 10, 20);

        expect(removed).toBe(true);
        expect(execute).toHaveBeenCalledOnce();
        const [sql, binds] = execute.mock.calls[0];
        expect(sql).toContain('(user_id = :user_id AND friend_user_id = :friend_user_id)');
        expect(sql).toContain('(user_id = :friend_user_id AND friend_user_id = :user_id)');
        expect(binds).toEqual({ user_id: 10, friend_user_id: 20 });
    });

    it('retorna false quando a relação já não existe', async () => {
        const execute = vi.fn().mockResolvedValue({ rowsAffected: 0 });

        await expect(removeFriendWithConnection({ execute }, 10, 20)).resolves.toBe(false);
    });

    it('impede remover o próprio usuário', async () => {
        const execute = vi.fn();

        await expect(removeFriendWithConnection({ execute }, 10, 10)).rejects.toThrow('AMIGO_INVALIDO');
        expect(execute).not.toHaveBeenCalled();
    });
});
