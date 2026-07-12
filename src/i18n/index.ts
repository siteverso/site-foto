import ptBR from './pt-BR';
import en from './en';
import es from './es';

export type Locale = 'pt-BR' | 'en' | 'es';
export type Messages = typeof ptBR;

export function normalizeLocale(value?: string): Locale {
  return value === 'en' || value === 'es' ? value : 'pt-BR';
}

export function getMessages(locale: Locale): Messages {
  if (locale === 'en') return en as unknown as Messages;
  if (locale === 'es') return es as unknown as Messages;
  return ptBR;
}
