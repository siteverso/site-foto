const configuredLimit = Number.parseInt(import.meta.env.PUBLIC_MESSAGE_MAX_LENGTH || '256', 10);

export const MESSAGE_MAX_LENGTH = Number.isFinite(configuredLimit)
    ? Math.min(4000, Math.max(1, configuredLimit))
    : 256;

export function validateMessageLength(value: unknown, fieldName = 'Mensagem'): string {
    const text = String(value || '').trim();
    if (text.length > MESSAGE_MAX_LENGTH) {
        throw new Error(`${fieldName} deve ter no máximo ${MESSAGE_MAX_LENGTH} caracteres.`);
    }
    return text;
}
