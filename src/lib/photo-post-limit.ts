export const PHOTO_POST_INTERVAL_TYPES = ['minute', 'hour', 'day', 'week', 'month'] as const;

export type PhotoPostIntervalType = typeof PHOTO_POST_INTERVAL_TYPES[number];

const INTERVAL_SECONDS: Record<PhotoPostIntervalType, number> = {
    minute: 60,
    hour: 60 * 60,
    day: 24 * 60 * 60,
    week: 7 * 24 * 60 * 60,
    month: 30 * 24 * 60 * 60,
};

const INTERVAL_LABELS: Record<PhotoPostIntervalType, string> = {
    minute: 'minuto',
    hour: 'hora',
    day: 'dia',
    week: 'semana',
    month: 'mês',
};

const UTC_NOW_SQL = 'CAST(SYS_EXTRACT_UTC(SYSTIMESTAMP) AS TIMESTAMP)';

export function normalizePhotoPostIntervalType(value: unknown): PhotoPostIntervalType {
    const normalized = String(value || '').trim().toLowerCase();
    return PHOTO_POST_INTERVAL_TYPES.includes(normalized as PhotoPostIntervalType)
        ? normalized as PhotoPostIntervalType
        : 'day';
}

export function normalizePhotoPostLimit(value: unknown, fallback = 1): number {
    const parsed = Number.parseInt(String(value || ''), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPhotoPostIntervalLabel(type: PhotoPostIntervalType): string {
    return INTERVAL_LABELS[type];
}

export function getPhotoPostIntervalSeconds(type: PhotoPostIntervalType): number {
    return INTERVAL_SECONDS[type];
}

export function getPhotoPostCutoffSql(type: PhotoPostIntervalType): string {
    if (type === 'month') return `ADD_MONTHS(${UTC_NOW_SQL}, -1)`;
    if (type === 'week') return `${UTC_NOW_SQL} - INTERVAL '7' DAY`;
    if (type === 'day') return `${UTC_NOW_SQL} - INTERVAL '1' DAY`;
    if (type === 'hour') return `${UTC_NOW_SQL} - INTERVAL '1' HOUR`;
    return `${UTC_NOW_SQL} - INTERVAL '1' MINUTE`;
}
