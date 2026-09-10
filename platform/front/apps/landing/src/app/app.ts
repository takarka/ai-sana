import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './shared/footer/footer';
import { Header } from './shared/header/header';
import { prefersReducedMotion } from './shared/reveal/reduced-motion';
import { Scene } from './shared/scene/scene';

@Component({
  imports: [RouterOutlet, Header, Footer, Scene],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);

  // Прикрывает окно гидратации между SSR-версткой и JS-эффектами (appReveal,
  // appSplitWords, WebGL-сцена) — без него виден flash пустого/полураскрытого
  // контента (см. комментарий в shared/reveal/split-words.ts). Перенос
  // initPreloader() из eighth-version/js/core.js на сигналы Angular.
  protected readonly prePct = signal(0);
  protected readonly preDone = signal(false);
  protected readonly preVisible = signal(true);

  constructor() {
    afterNextRender(() => this.runPreloader());
  }

  private runPreloader(): void {
    if (prefersReducedMotion()) {
      this.preVisible.set(false);
      return;
    }

    const CAP = 1100;
    const MIN = 400;
    const t0 = Date.now();
    let ready = false;
    let finished = false;

    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      ready = true;
    });

    const tick = setInterval(() => {
      const elapsed = Date.now() - t0;
      const progress = ready ? Math.min(1, elapsed / MIN) : Math.min(0.92, elapsed / CAP);
      this.prePct.set(Math.round(progress * 100));
      if ((ready && elapsed >= MIN) || elapsed >= CAP) finish();
    }, 40);

    const finish = (): void => {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      this.prePct.set(100);
      setTimeout(() => {
        this.preDone.set(true);
        setTimeout(() => this.preVisible.set(false), 700);
      }, 120);
    };

    const cap = setTimeout(finish, CAP + 600);

    this.destroyRef.onDestroy(() => {
      clearInterval(tick);
      clearTimeout(cap);
    });
  }
}
