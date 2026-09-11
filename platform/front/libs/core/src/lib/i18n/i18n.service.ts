import { Injectable, signal } from '@angular/core';
import { KK_DICTIONARY } from './dictionaries/kk';
import { RU_DICTIONARY } from './dictionaries/ru';
import { APP_LANGUAGES, AppLanguage, TranslationDictionary } from './i18n.types';

const STORAGE_KEY = 'craft-admin-lang';

const DICTIONARIES: Readonly<Record<AppLanguage, TranslationDictionary>> = {
  ru: RU_DICTIONARY,
  kk: KK_DICTIONARY,
};

function isAppLanguage(value: string | null): value is AppLanguage {
  return value !== null && (APP_LANGUAGES as readonly string[]).includes(value);
}

function readStoredLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isAppLanguage(stored) ? stored : 'ru';
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — падать назад на ru.
    return 'ru';
  }
}

// Рантайм-i18n кабинета (ADR-0004): переключение языка не перезагружает
// страницу и не роняет несохранённые данные — сигнал вместо сборки на локаль.
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly languageSignal = signal<AppLanguage>(readStoredLanguage());

  readonly language = this.languageSignal.asReadonly();
  readonly availableLanguages = APP_LANGUAGES;

  setLanguage(language: AppLanguage): void {
    this.languageSignal.set(language);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Сохранить выбор не удалось — сессия всё равно переключится, просто не запомнится.
    }
  }

  translate(key: string, params?: Readonly<Record<string, string | number>>): string {
    const dictionary = DICTIONARIES[this.languageSignal()];
    const template = dictionary[key] ?? RU_DICTIONARY[key] ?? key;
    return params ? interpolate(template, params) : template;
  }
}

function interpolate(template: string, params: Readonly<Record<string, string | number>>): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, paramName: string) =>
    paramName in params ? String(params[paramName]) : match,
  );
}
