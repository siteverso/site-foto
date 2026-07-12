export const THEMES = ['light', 'light-warm', 'dark', 'dark-blue'] as const;

export type Theme = typeof THEMES[number];

export function normalizeTheme(value: unknown): Theme {
    const normalized = String(value ?? '').trim().toLowerCase();
    return THEMES.includes(normalized as Theme) ? normalized as Theme : 'light';
}

export function themeColorScheme(theme: Theme): 'light' | 'dark' {
    return theme.startsWith('dark') ? 'dark' : 'light';
}
