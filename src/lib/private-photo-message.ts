import { MESSAGE_MAX_LENGTH } from './message-limit';

export function normalizePrivatePhotoMessage(value: unknown): string {
    const message = String(value || '').trim();
    if (!message || message.length > MESSAGE_MAX_LENGTH) {
        throw new Error('MENSAGEM_PRIVADA_INVALIDA');
    }
    return message;
}

export function normalizePhotoId(value: unknown): number {
    const photoId = Number(value);
    if (!Number.isInteger(photoId) || photoId <= 0) {
        throw new Error('FOTO_INVALIDA');
    }
    return photoId;
}
