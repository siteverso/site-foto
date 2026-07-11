export const OBSERVER_VISIBILITIES = ['public', 'private'] as const;

export type ObserverVisibility = typeof OBSERVER_VISIBILITIES[number];

export function normalizeObserverVisibility(value: unknown): ObserverVisibility {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'public' || normalized === 'private') return normalized;
    throw new Error('VISIBILIDADE_OBSERVADOS_INVALIDA');
}

export function canViewObservedList(
    profileOwnerId: number,
    viewerUserId: number,
    visibility: ObserverVisibility,
): boolean {
    return profileOwnerId === viewerUserId || visibility === 'public';
}
