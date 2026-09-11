// Рантайм-i18n кабинета (ADR-0004) — RU/KZ, переключение без перезагрузки.
export type AppLanguage = 'ru' | 'kk';

export type TranslationDictionary = Readonly<Record<string, string>>;

export const APP_LANGUAGES: readonly AppLanguage[] = ['ru', 'kk'];
