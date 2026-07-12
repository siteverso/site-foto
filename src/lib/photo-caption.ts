import { validateMessageLength } from './message-limit';

export function normalizePhotoCaption(value: unknown): string {
    const caption = validateMessageLength(String(value ?? ''), 'A legenda');
    return caption.trim();
}
