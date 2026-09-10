import '@angular/localize/init';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// В jsdom нет IntersectionObserver, а на нём держатся пины героя и пауза
// WebGL-сцены. Заглушка живёт здесь, а не в виде проверок в компонентах:
// это пробел тестового окружения, в браузерах API есть везде.
class NoopIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];
  observe(): void {
    /* наблюдать в jsdom нечего: layout не считается */
  }
  unobserve(): void {
    /* см. observe() */
  }
  disconnect(): void {
    /* см. observe() */
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = NoopIntersectionObserver;

// jsdom не реализует getContext и на каждый вызов пишет «Not implemented» в
// консоль — из-за этого шума легко пропустить настоящую ошибку в выводе
// тестов. Возвращаем null: ровно так ведёт себя браузер без WebGL, а это и
// есть ветка, которую проверяет scene.spec.ts.
HTMLCanvasElement.prototype.getContext = () => null;

// Тот же случай: jsdom не реализует matchMedia, а по нему сцена решает,
// запускаться ли (prefers-reduced-motion) и слабое ли устройство.
window.matchMedia = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;
