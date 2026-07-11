export const OBSERVER_VISIBILITIES = ['public', 'private'] as const;

export type ObserverVisibility = typeof OBSERVER_VISIBILITIES[number];

export function normalizeObserverVisibility(value: unknown): ObserverVisibility {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'public' || normalized === 'private') return normalized;
    throw new Error('VISIBILIDADE_OBSERVADOS_INVALIDA');
}

export function normalizeHiddenObservedUserIds(value: unknown): number[] {
    if (value == null) return [];
    if (!Array.isArray(value)) throw new Error('OBSERVADOS_OCULTOS_INVALIDOS');

    return [...new Set(value.map(item => Number(item)))]
        .filter(item => Number.isSafeInteger(item) && item > 0)
        .sort((a, b) => a - b);
}

export function canViewObservedList(
    profileOwnerId: number,
    viewerUserId: number,
    visibility: ObserverVisibility,
): boolean {
    return profileOwnerId === viewerUserId || visibility === 'public';
}
