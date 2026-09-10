import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { whenIdle } from '../when-idle';
import type { SceneHandle } from './scene-globe';
import { SceneHost } from './scene-host';

// Обвязка сцены — порт bootScene() из eighth-version/js/core.js: все проверки
// оттуда сохранены (reduced-motion, наличие WebGL, saveData, слабое
// устройство, вкладка в фоне, потеря контекста, видимость ink-полос).
// Отличий от оригинала два, оба вынужденные:
//   1. resize: scene.js отдавал наружу resize(), но его никто не подписывал на
//      window — канвас не следовал за размером окна. Здесь слушатель есть.
//   2. ink-полосы приходится пересканировать после навигации: в eighth-version
//      каждая страница была отдельной загрузкой, здесь — SPA, и полосы
//      предыдущего маршрута исчезают из DOM вместе с ним.

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

function connection(): NetworkInformationLike | undefined {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
}

function deviceMemory(): number {
  return (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
}

function hasWebGL(doc: Document): boolean {
  try {
    const probe = doc.createElement('canvas');
    return !!(
      probe.getContext('webgl2') ||
      probe.getContext('webgl') ||
      probe.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

function isLowPower(): boolean {
  const conn = connection();
  return (
    window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
    (navigator.hardwareConcurrency || 8) <= 4 ||
    deviceMemory() <= 4 ||
    !!(conn && (conn.saveData || /2g/.test(conn.effectiveType || '')))
  );
}

@Component({
  selector: 'app-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas id="scene" aria-hidden="true"></canvas>`,
  styleUrl: './scene.scss',
})
export class Scene {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly host = inject(SceneHost);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private handle: SceneHandle | null = null;
  private readonly inkOnScreen = new Set<Element>();
  private inkObserver: IntersectionObserver | null = null;

  constructor() {
    // afterNextRender не выполняется на сервере — сцена не трогает SSR-рендер,
    // а на клиенте стартует уже после первой отрисовки, не занимая TTI.
    afterNextRender(() => this.boot());
    this.destroyRef.onDestroy(() => this.teardown());
  }

  private boot(): void {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || !hasWebGL(this.document) || connection()?.saveData) return;

    // Пользователь может включить «меньше движения» уже после старта — тогда
    // сцену надо погасить, а не оставить крутиться.
    const onMotionChange = () => {
      if (motion.matches) this.teardown();
    };
    motion.addEventListener('change', onMotionChange);
    this.destroyRef.onDestroy(() => motion.removeEventListener('change', onMotionChange));

    const lowPower = isLowPower();
    const styles = window.getComputedStyle(this.document.body);

    whenIdle(async () => {
      const { initScene } = await import('./scene-globe');
      const handle = initScene({
        canvas: this.canvas().nativeElement,
        base: styles.getPropertyValue('--on-ink-dim').trim() || '#93a2c4',
        ridge: styles.getPropertyValue('--signal-lift').trim() || '#7e8bff',
        particles: lowPower ? 12000 : 24000,
        dpr: Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2),
      });
      this.handle = handle;
      this.host.set(handle);
      this.watch(handle);
    });
  }

  private watch(handle: SceneHandle): void {
    const canvas = this.canvas().nativeElement;

    const onResize = () => handle.resize();
    window.addEventListener('resize', onResize, { passive: true });

    const onVisibility = () =>
      handle.setPaused(this.document.hidden || this.inkOnScreen.size === 0);
    this.document.addEventListener('visibilitychange', onVisibility);

    // Сцену видно только сквозь .band--ink (они прозрачны, см.
    // landing-layout.scss) — пока на экране нет ни одной, рисовать нечего.
    this.inkObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) this.inkOnScreen.add(entry.target);
          else this.inkOnScreen.delete(entry.target);
        }
        onVisibility();
      },
      { threshold: 0 }
    );
    this.observeInkBands();

    const navigation = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      // Новый маршрут отрисуется после текущей задачи — полосы ищем уже в
      // готовом DOM.
      .subscribe(() => setTimeout(() => this.observeInkBands()));

    const onContextLost = (event: Event) => {
      event.preventDefault();
      handle.setPaused(true);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
      this.document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      navigation.unsubscribe();
      this.inkObserver?.disconnect();
      this.inkObserver = null;
    });
  }

  private observeInkBands(): void {
    const observer = this.inkObserver;
    if (!observer) return;
    observer.disconnect();
    this.inkOnScreen.clear();
    this.document.querySelectorAll('.band--ink').forEach((band) => observer.observe(band));
  }

  private teardown(): void {
    this.handle?.dispose();
    this.handle = null;
    this.host.set(null);
  }
}
