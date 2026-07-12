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

export function formatPhotoPostRetry(seconds: number): string {
    const safeSeconds = Math.max(1, Math.ceil(Number(seconds) || 1));
    if (safeSeconds < 60) return `${safeSeconds} segundo${safeSeconds === 1 ? '' : 's'}`;

    const minutes = Math.ceil(safeSeconds / 60);
    if (minutes < 60) return `${minutes} minuto${minutes === 1 ? '' : 's'}`;

    const hours = Math.ceil(minutes / 60);
    if (hours < 24) return `${hours} hora${hours === 1 ? '' : 's'}`;

    const days = Math.ceil(hours / 24);
    if (days < 7) return `${days} dia${days === 1 ? '' : 's'}`;

    const weeks = Math.ceil(days / 7);
    return `${weeks} semana${weeks === 1 ? '' : 's'}`;
}

export function getPhotoPostCutoffSql(type: PhotoPostIntervalType): string {
    if (type === 'month') return 'ADD_MONTHS(CURRENT_TIMESTAMP, -1)';

    const oracleUnit = {
        minute: 'MINUTE',
        hour: 'HOUR',
        day: 'DAY',
        week: 'DAY',
    }[type];
    const amount = type === 'week' ? 7 : 1;
    return `CURRENT_TIMESTAMP - NUMTODSINTERVAL(${amount}, '${oracleUnit}')`;
}

export function getPhotoPostRetrySql(type: PhotoPostIntervalType): string {
    if (type === 'month') {
        return `CEIL(GREATEST(0,
            (CAST(ADD_MONTHS(CAST(MIN(created_at) AS DATE), 1) AS DATE)
             - CAST(CURRENT_TIMESTAMP AS DATE)) * 86400))`;
    }

    const oracleUnit = {
        minute: 'MINUTE',
        hour: 'HOUR',
        day: 'DAY',
        week: 'DAY',
    }[type];
    const amount = type === 'week' ? 7 : 1;

    return `CEIL(GREATEST(0,
        (CAST(MIN(created_at) + NUMTODSINTERVAL(${amount}, '${oracleUnit}') AS DATE)
         - CAST(CURRENT_TIMESTAMP AS DATE)) * 86400))`;
}
