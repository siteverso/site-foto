import type { SexCode } from './account-profile';

export function getObserverSectionTitle(isOwner: boolean, sexCode: SexCode): string {
    if (isOwner) return 'Meus observadores';
    if (sexCode === 'F') return 'Observando ela';
    if (sexCode === 'M') return 'Observando ele';
    return 'Observadores';
}

export function getObservedSectionTitle(isOwner: boolean, sexCode: SexCode): string {
    if (isOwner) return 'Estou observando';
    if (sexCode === 'F') return 'Quem ela observa';
    if (sexCode === 'M') return 'Quem ele observa';
    return 'Observando';
}
