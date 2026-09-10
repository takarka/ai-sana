import { Injectable, signal } from '@angular/core';
import type { SceneHandle } from './scene-globe';

// Точка встречи сцены и того, кто на неё завязан (пины героя). В
// eighth-version роль этого сервиса играла глобальная переменная
// window.__scene; здесь — сигнал, чтобы подписчик просто реагировал на
// появление сцены и не знал, загрузилась ли она вообще (её может не быть:
// prefers-reduced-motion, отсутствие WebGL, saveData — см. scene.ts).
@Injectable({ providedIn: 'root' })
export class SceneHost {
  private readonly handle = signal<SceneHandle | null>(null);
  readonly scene = this.handle.asReadonly();

  set(scene: SceneHandle | null): void {
    this.handle.set(scene);
  }
}
