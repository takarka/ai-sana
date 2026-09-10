import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { prefersReducedMotion } from './reduced-motion';

// Перенос initReveals() из eighth-version/js/core.js для элементов .js-rise:
// блок появляется, когда доезжает до вьюпорта, и больше не отслеживается.
// Класс вешает сама директива, чтобы в разметке не дублировать
// `class="js-rise" appReveal`.
@Directive({
  selector: '[appReveal]',
  host: { class: 'js-rise' },
})
export class RevealOnScroll {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // На сервере класс js-rise отрендерится (SSR отдаёт разметку как есть),
    // а показ включится уже на клиенте. Без JS его включает <noscript> в
    // index.html — иначе контент остался бы невидимым.
    afterNextRender(() => {
      const element = this.host.nativeElement;
      if (prefersReducedMotion()) {
        element.classList.add('is-in');
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.12 }
      );
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
