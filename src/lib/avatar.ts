/**
 * Resolve as origens de avatar em ordem de confiabilidade.
 *
 * A imagem BLOB do próprio banco é sempre tentada primeiro quando há ID.
 * A URL legada/externa fica como fallback, sem duplicar a mesma origem.
 */
export function getAvatarSources(userId?: number | string | null, avatarUrl?: string | null): string[] {
    const sources: string[] = [];
    const numericUserId = Number(userId);

    if (Number.isSafeInteger(numericUserId) && numericUserId > 0) {
        sources.push(`/api/users/${numericUserId}/avatar`);
    }

    const normalizedAvatarUrl = String(avatarUrl || '').trim();
    if (normalizedAvatarUrl && !sources.includes(normalizedAvatarUrl.split('?')[0] || normalizedAvatarUrl)) {
        sources.push(normalizedAvatarUrl);
    }

    return [...new Set(sources)];
}
