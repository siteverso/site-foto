export type SexCode = '' | 'M' | 'F';

export function normalizeSexCode(value: unknown): SexCode {
    const normalized = String(value || '').trim().toUpperCase();
    if (normalized === '') return '';
    if (normalized === 'M' || normalized === 'F') return normalized;
    throw new Error('SEXO_INVALIDO');
}
