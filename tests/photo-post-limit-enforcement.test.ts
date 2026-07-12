import { Buffer } from 'node:buffer';
import { describe, expect, it, vi } from 'vitest';
import { PhotoLimitError, saveTodayPhotoWithConnection } from '../src/lib/server/repositories/photos';

const photoInput = {
    userId: 9,
    caption: 'teste',
    filename: 'foto.jpg',
    mimeType: 'image/jpeg',
    image: Buffer.from('foto'),
};

describe('photo post limit enforcement', () => {
    it('não executa INSERT quando já existe uma foto na janela e o limite é 1', async () => {
        const execute = vi.fn()
            .mockResolvedValueOnce({ rows: [{ ID: 9 }] })
            .mockResolvedValueOnce({ rows: [{ TOTAL: 1 }] });
        const connection = {
            execute,
            commit: vi.fn(),
            rollback: vi.fn().mockResolvedValue(undefined),
        };

        await expect(saveTodayPhotoWithConnection(connection, photoInput, {
            limit: 1,
            intervalType: 'minute',
        })).rejects.toBeInstanceOf(PhotoLimitError);

        expect(execute).toHaveBeenCalledTimes(2);
        expect(execute.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO murm_post'))).toBe(false);
        expect(connection.commit).not.toHaveBeenCalled();
        expect(connection.rollback).toHaveBeenCalledOnce();
    });

    it('executa INSERT quando não há foto na janela', async () => {
        const execute = vi.fn()
            .mockResolvedValueOnce({ rows: [{ ID: 9 }] })
            .mockResolvedValueOnce({ rows: [{ TOTAL: 0 }] })
            .mockResolvedValueOnce({ outBinds: { id: [188] } });
        const connection = {
            execute,
            commit: vi.fn().mockResolvedValue(undefined),
            rollback: vi.fn(),
        };

        await expect(saveTodayPhotoWithConnection(connection, photoInput, {
            limit: 1,
            intervalType: 'minute',
        })).resolves.toBe(188);

        expect(execute.mock.calls.some(([sql]) => String(sql).includes('INSERT INTO murm_post'))).toBe(true);
        expect(connection.commit).toHaveBeenCalledOnce();
        expect(connection.rollback).not.toHaveBeenCalled();
    });
});
